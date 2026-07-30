import React from "react";
import { type UseFormReturn } from "react-hook-form";
import { type BaseActionHandler } from "./BaseActionHandler";
import { WebhookActionForm, formatWebhookHeaders } from "./WebhookActionForm";
import {
  type AutomationDomain,
  AvailableWebhookApiSchema,
  WebhookDefaultHeaders,
  TriggerEventSource,
  type ActionCreate,
  type ActionDomain,
} from "@langfuse/shared";
import { z } from "zod";

// Define the form schema for webhook actions
// Exported to silence @typescript-eslint/no-unused-vars v8 warning
// (used for type extraction via z.infer<typeof>, which is a legitimate pattern)
export const WebhookActionFormSchema = z.object({
  webhook: z.object({
    url: z.url("URL 无效"),
    headers: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          displayValue: z.string(),
          isSecret: z.boolean(),
          wasSecret: z.boolean(),
        }),
      )
      .default([]),
    apiVersion: AvailableWebhookApiSchema.default({ prompt: "v1" }),
  }),
});

type WebhookActionFormData = z.infer<typeof WebhookActionFormSchema>;

// Define a type for header pairs
type HeaderPair = {
  name: string;
  value: string;
  displayValue: string;
  isSecret: boolean;
  wasSecret: boolean;
};

export class WebhookActionHandler implements BaseActionHandler<WebhookActionFormData> {
  actionType = "WEBHOOK" as const;

  // Parse existing headers if available
  private parseHeaders(automation?: AutomationDomain): HeaderPair[] {
    if (
      automation?.action?.type === "WEBHOOK" &&
      automation?.action?.config &&
      "displayHeaders" in automation.action.config &&
      automation.action.config.displayHeaders
    ) {
      try {
        const displayHeaders = automation.action.config.displayHeaders;

        return Object.entries(displayHeaders).map(([name, headerObj]) => ({
          name,
          value: headerObj.secret ? "" : headerObj.value,
          displayValue: headerObj.value,
          isSecret: headerObj.secret,
          wasSecret: headerObj.secret,
        }));
      } catch (e) {
        console.error("Failed to parse headers:", e);
        return [];
      }
    }
    return [];
  }

  getDefaultValues(
    automation?: AutomationDomain,
    eventSource?: TriggerEventSource,
  ): WebhookActionFormData {
    // Extract apiVersion from existing config
    let apiVersion: z.infer<typeof AvailableWebhookApiSchema> =
      eventSource === TriggerEventSource.Monitor
        ? { monitor: "v1" }
        : eventSource === TriggerEventSource.ProjectNotification
          ? { "project-notification": "v1" }
          : { prompt: "v1" };
    if (
      automation?.action?.type === "WEBHOOK" &&
      automation?.action?.config &&
      "apiVersion" in automation.action.config &&
      automation.action.config.apiVersion
    ) {
      apiVersion = automation.action.config.apiVersion;
    }

    return {
      webhook: {
        url:
          (automation?.action?.type === "WEBHOOK" &&
            automation?.action?.config &&
            "url" in automation.action.config &&
            automation.action.config.url) ||
          "",
        headers: this.parseHeaders(automation),
        apiVersion,
      },
    };
  }

  validateFormData(formData: WebhookActionFormData): {
    isValid: boolean;
    errors?: string[];
  } {
    const errors: string[] = [];

    if (!formData.webhook?.url) {
      errors.push("Webhook URL 为必填");
    }

    // Validate headers
    if (formData.webhook?.headers) {
      const defaultHeaderKeys = Object.keys(WebhookDefaultHeaders);

      formData.webhook.headers.forEach((header: HeaderPair, index: number) => {
        // Only validate non-empty headers
        if (header.name.trim() || header.value.trim()) {
          if (!header.name.trim()) {
            errors.push(`请求头 ${index + 1}:名称不能为空`);
          }
          if (!header.value.trim() && !header.isSecret) {
            errors.push(`请求头 ${index + 1}:值不能为空`);
          }
          if (header.wasSecret !== header.isSecret && !header.value.trim()) {
            errors.push(
              `请求头 ${index + 1}:将请求头设为${header.wasSecret ? "公开" : "加密"}时必须提供值`,
            );
          }

          // Check if header name conflicts with default headers
          if (
            header.name.trim() &&
            defaultHeaderKeys.includes(header.name.trim().toLowerCase())
          ) {
            errors.push(
              `请求头 ${index + 1}:"${header.name}"由 Langfuse 自动添加,无法自定义`,
            );
          }
        }
      });

      // check if header name is already in the form
      // Check for duplicate header names (case-insensitive)
      const headerNames = formData.webhook.headers
        .filter((h) => h.name.trim()) // Only check non-empty header names
        .map((h) => h.name.trim().toLowerCase());

      const uniqueHeaderNames = new Set(headerNames);
      if (uniqueHeaderNames.size < headerNames.length) {
        errors.push(
          "不允许重复的请求头名称（不区分大小写）",
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  buildActionConfig(formData: WebhookActionFormData): ActionCreate {
    // Convert headers array to requestHeaders format
    let headersObject: Record<string, { secret: boolean; value: string }> = {};

    if (formData.webhook?.headers) {
      headersObject = formatWebhookHeaders(formData.webhook.headers);
    }

    return {
      type: "WEBHOOK",
      url: formData.webhook?.url || "",
      requestHeaders: headersObject,
      apiVersion: formData.webhook?.apiVersion || { prompt: "v1" },
    };
  }

  renderForm(props: {
    form: UseFormReturn<WebhookActionFormData>;
    disabled: boolean;
    projectId: string;
    action?: ActionDomain;
  }) {
    return (
      <WebhookActionForm
        form={props.form}
        disabled={props.disabled}
        projectId={props.projectId}
        action={props.action}
      />
    );
  }
}

import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { PasswordInput } from "@/src/components/ui/password-input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { BlobStorageIntegrationType } from "@langfuse/shared";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";

// Provider selection plus the connection fields whose labels and visibility
// depend on it: bucket/container, endpoint, region, path style, credentials,
// and prefix.
export const StorageProviderFields = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  // Check if this is a self-hosted instance (no cloud region set)
  const isSelfHosted = !isLangfuseCloud;
  const integrationType =
    useWatch({ control, name: "type" }) ?? BlobStorageIntegrationType.S3;

  return (
    <>
      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>存储提供商</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S3">AWS S3</SelectItem>
                  <SelectItem value="S3_COMPATIBLE">
                    S3兼容存储
                  </SelectItem>
                  <SelectItem value="AZURE_BLOB_STORAGE">
                    Azure Blob存储
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              选择您的云存储提供商
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="bucketName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? "容器名称"
                : "存储桶名称"}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? "Azure容器名称（3-63个字符，仅限小写字母、数字和连字符）"
                : "S3存储桶名称"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Endpoint URL field - Only shown for S3-compatible and Azure */}
      {integrationType !== "S3" && (
        <FormField
          control={control}
          name="endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>端点URL</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? "Azure Blob存储端点URL（例如：https://accountname.blob.core.windows.net）"
                  : "S3兼容端点URL（例如：https://play.min.io）"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Region field - Only shown for AWS S3 or compatible storage */}
      {integrationType !== "AZURE_BLOB_STORAGE" && (
        <FormField
          control={control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>区域</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {integrationType === "S3"
                  ? "AWS区域（例如：us-east-1）"
                  : "S3兼容存储区域"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Force Path Style switch - Only shown for S3-compatible */}
      {integrationType === "S3_COMPATIBLE" && (
        <FormField
          control={control}
          name="forcePathStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>强制路径样式</FormLabel>
              <FormControl>
                <div className="mt-1 ml-4">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormDescription>
                为MinIO和其他S3兼容提供商启用
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="accessKeyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? "存储账户名称"
                : integrationType === "S3"
                  ? "AWS访问密钥ID"
                  : "访问密钥ID"}
              {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
              {isSelfHosted && integrationType === "S3" && (
                <span className="text-muted-foreground">（可选）</span>
              )}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? "您的Azure存储账户名称"
                : integrationType === "S3"
                  ? isSelfHosted
                    ? "您的AWS IAM用户访问密钥ID。留空以使用主机凭证（IAM角色、实例配置文件等）"
                    : "您的AWS IAM用户访问密钥ID"
                  : "S3兼容存储的访问密钥"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="secretAccessKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? "存储账户密钥"
                : integrationType === "S3"
                  ? "AWS秘密访问密钥"
                  : "秘密访问密钥"}
              {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
              {isSelfHosted && integrationType === "S3" && (
                <span className="text-muted-foreground">（可选）</span>
              )}
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="********************"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? "您的Azure存储账户访问密钥"
                : integrationType === "S3"
                  ? isSelfHosted
                    ? "您的AWS IAM用户秘密访问密钥。留空以使用主机凭证（IAM角色、实例配置文件等）"
                    : "您的AWS IAM用户秘密访问密钥"
                  : "S3兼容存储的秘密密钥"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>导出前缀</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? 'Azure容器中导出文件的可选前缀路径（例如："langfuse-exports/"）'
                : integrationType === "S3"
                  ? 'S3存储桶中导出文件的可选前缀路径（例如："langfuse-exports/"）'
                  : '导出文件的可选前缀路径（例如："langfuse-exports/"）'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableCellWithCopyButton,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import Header from "@/src/components/layouts/header";
import { useHasEntitlement } from "@/src/features/entitlements/hooks";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { showSuccessToast } from "@/src/features/notifications/showSuccessToast";
import { useHasOrganizationAccess } from "@/src/features/rbac/utils/checkOrganizationAccess";
import { api } from "@/src/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ChevronRight, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const addDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(253)
    .transform((v) => v.toLowerCase())
    .refine(
      (v) =>
        /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(
          v,
        ),
      { message: "域名格式无效（例如 acme.com）" },
    ),
});

type AddDomainInput = z.infer<typeof addDomainSchema>;

export const VerifiedDomainsSettings = ({ orgId }: { orgId: string }) => {
  const hasEntitlement = useHasEntitlement("cloud-multi-tenant-sso");
  const hasAccess = useHasOrganizationAccess({
    organizationId: orgId,
    scope: "organization:update",
  });

  const heading = (
    <>
      <Header title="已验证域名" />
      <p className="text-muted-foreground mb-4 text-sm">
        您只能为组织拥有的域名配置单点登录(SSO)。通过 DNS 验证域名以启用单点登录(SSO)。
      </p>
    </>
  );

  if (!hasEntitlement) {
    return (
      <div>
        {heading}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>不可用</AlertTitle>
          <AlertDescription>
            已验证域名和企业级单点登录(SSO)在您的套餐中不可用。请升级以使用此功能。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div>
        {heading}
        <Alert>
          <AlertTitle>访问被拒绝</AlertTitle>
          <AlertDescription>
            您没有权限管理此组织的已验证域名。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        title="已验证域名"
        actionButtons={<AddDomainButton orgId={orgId} />}
      />
      <p className="text-muted-foreground text-sm">
        您只能为组织拥有的域名配置单点登录(SSO)。通过 DNS 验证域名以启用单点登录(SSO)。
      </p>
      <DomainsTable orgId={orgId} />
    </div>
  );
};

function DomainsTable({ orgId }: { orgId: string }) {
  const query = api.verifiedDomain.list.useQuery({ orgId });

  return (
    <Card className="mb-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary pl-2.5">域名</TableHead>
            <TableHead className="text-primary">状态</TableHead>
            <TableHead className="text-primary hidden md:table-cell">
              添加时间
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody className="text-muted-foreground">
          {query.data && query.data.length === 0 ? (
            <TableRow>
              <TableCell
                density="comfortable"
                colSpan={4}
                className="py-12 text-center text-sm"
              >
                尚未添加域名
              </TableCell>
            </TableRow>
          ) : (
            query.data?.map((row) => (
              <DomainRow key={row.id} orgId={orgId} row={row} />
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

type DomainRowData = {
  id: string;
  domain: string;
  verifiedAt: Date | null;
  createdAt: Date;
  recordHost: string;
  recordValue: string;
};

function DomainRow({ orgId, row }: { orgId: string; row: DomainRowData }) {
  const [expanded, setExpanded] = useState(!row.verifiedAt);
  const utils = api.useUtils();

  const verifyMutation = api.verifiedDomain.verify.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      utils.ssoConfig.get.invalidate({ orgId });
      showSuccessToast({
        title: "域名已验证",
        description: `${row.domain} 已验证通过。`,
      });
    },
    onError: (err) => {
      showErrorToast("验证失败", err.message);
    },
  });

  return (
    <>
      <TableRow className="hover:bg-primary-foreground">
        <TableCell density="comfortable" className="font-mono">
          {!row.verifiedAt ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1"
            >
              <ChevronRight
                className={`h-3 w-3 transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
              {row.domain}
            </button>
          ) : (
            row.domain
          )}
        </TableCell>
        <TableCell density="comfortable">
          {row.verifiedAt ? (
            <Badge variant="default">已验证</Badge>
          ) : (
            <Badge variant="secondary">待验证</Badge>
          )}
        </TableCell>
        <TableCell density="comfortable" className="hidden md:table-cell">
          {row.createdAt.toLocaleDateString()}
        </TableCell>
        <TableCell
          density="comfortable"
          className="flex items-center justify-end gap-2"
        >
          {!row.verifiedAt && (
            <Button
              size="sm"
              onClick={() => verifyMutation.mutate({ orgId, id: row.id })}
              loading={verifyMutation.isPending}
            >
              验证
            </Button>
          )}
          <DeleteDomainButton
            orgId={orgId}
            id={row.id}
            domain={row.domain}
            verified={Boolean(row.verifiedAt)}
          />
        </TableCell>
      </TableRow>
      {!row.verifiedAt && expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={4} className="py-4">
            <DnsInstructions
              recordHost={row.recordHost}
              recordValue={row.recordValue}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function DnsInstructions({
  recordHost,
  recordValue,
}: {
  recordHost: string;
  recordValue: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold">
        请在您的 DNS 服务商处添加以下 TXT 记录：
      </p>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">类型</TableHead>
              <TableHead className="w-54">主机</TableHead>
              <TableHead>值</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell density="comfortable" className="w-16 font-mono">
                TXT
              </TableCell>
              <TableCellWithCopyButton
                density="comfortable"
                text={recordHost}
                className="w-54 py-3 font-mono break-all"
              />
              <TableCellWithCopyButton
                density="comfortable"
                text={recordValue}
                className="py-3 font-mono break-all"
              />
            </TableRow>
          </TableBody>
        </Table>
      </Card>
      <p className="text-muted-foreground text-xs">
        DNS 变更可能需要最多 24 小时才能生效。添加记录后，
        点击<span className="font-bold">验证</span>。
      </p>
    </div>
  );
}

function AddDomainButton({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<AddDomainInput>({
    resolver: zodResolver(addDomainSchema),
    defaultValues: { domain: "" },
  });

  const createMutation = api.verifiedDomain.create.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      showSuccessToast({
        title: "域名已添加",
        description:
          "请添加表格中显示的 DNS TXT 记录，然后点击验证。",
      });
      form.reset();
      setOpen(false);
    },
    onError: (err) => {
      form.setError("domain", { message: err.message });
    },
  });

  function onSubmit(values: AddDomainInput) {
    createMutation.mutate({ orgId, domain: values.domain });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">添加域名</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加域名</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>域名</FormLabel>
                    <FormControl>
                      <Input placeholder="acme.com" autoFocus {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                添加
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDomainButton({
  orgId,
  id,
  domain,
  verified,
}: {
  orgId: string;
  id: string;
  domain: string;
  verified: boolean;
}) {
  const utils = api.useUtils();

  const deleteMutation = api.verifiedDomain.delete.useMutation({
    onSuccess: () => {
      utils.verifiedDomain.list.invalidate({ orgId });
      showSuccessToast({
        title: "域名已移除",
        description: `${domain} 已被移除。`,
      });
    },
    onError: (err) => {
      showErrorToast("移除域名失败", err.message);
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={`移除 ${domain}`}>
          <TrashIcon className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>移除 {domain}？</AlertDialogTitle>
          <AlertDialogDescription>
            {verified
              ? "如果该域名存在单点登录(SSO)配置，您必须先移除它。域名可以稍后重新验证。"
              : "此操作将移除待处理的声明。域名可以稍后重新添加和验证。"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate({ orgId, id })}
            disabled={deleteMutation.isPending}
          >
            移除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

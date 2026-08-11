import BackgroundMigrationsTable from "@/src/features/background-migrations/components/background-migrations";
import Head from "next/head";

export default function BackgroundMigrationsPage() {
  return (
    <>
      <Head>
        <title>后台迁移 | Oxelia51</title>
      </Head>
      <BackgroundMigrationsTable />
    </>
  );
}

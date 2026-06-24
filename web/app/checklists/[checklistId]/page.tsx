import {ChecklistClient} from './ChecklistClient';

type ChecklistPageSearchParams = {
  saveToAccount?: string | string[];
};

type ChecklistPageProps = {
  params: Promise<{
    checklistId: string;
  }>;
  searchParams?: Promise<ChecklistPageSearchParams>;
};

export {
  ChecklistClient,
  getAccountSaveHref,
  getShareHref,
} from './ChecklistClient';

function hasSaveToAccount(searchParam: string | string[] | undefined): boolean {
  return Array.isArray(searchParam)
    ? searchParam.includes('1')
    : searchParam === '1';
}

export default async function ChecklistPage({
  params,
  searchParams,
}: ChecklistPageProps) {
  const {checklistId} = await params;
  const resolvedSearchParams: ChecklistPageSearchParams = searchParams
    ? await searchParams
    : {};

  return (
    <ChecklistClient
      checklistId={checklistId}
      saveToAccount={hasSaveToAccount(resolvedSearchParams.saveToAccount)}
    />
  );
}

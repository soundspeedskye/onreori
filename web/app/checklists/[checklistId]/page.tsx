import {ChecklistClient} from './ChecklistClient';

type ChecklistPageProps = {
  params: Promise<{
    checklistId: string;
  }>;
};

export {
  ChecklistClient,
  getAccountSaveHref,
  getShareHref,
} from './ChecklistClient';

export default async function ChecklistPage({params}: ChecklistPageProps) {
  const {checklistId} = await params;

  return <ChecklistClient checklistId={checklistId} />;
}

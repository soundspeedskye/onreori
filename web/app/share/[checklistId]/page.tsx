import {SharePageClient} from './SharePageClient';

type SharePageProps = {
  params: Promise<{
    checklistId: string;
  }>;
};

export default async function SharePage({params}: SharePageProps) {
  const {checklistId} = await params;

  return <SharePageClient checklistId={checklistId} />;
}

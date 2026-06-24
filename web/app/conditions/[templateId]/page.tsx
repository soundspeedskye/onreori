import {ConditionsClient} from './ConditionsClient';

import {EmptyState} from '@/components/ui/EmptyState';
import {getTemplateById} from '@/data/templates';

type ConditionsPageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export default async function ConditionsPage({params}: ConditionsPageProps) {
  const {templateId} = await params;
  const template = getTemplateById(templateId);

  if (!template) {
    return (
      <main className="screen">
        <EmptyState
          description="다른 카테고리에서 다시 시작해주세요."
          title="템플릿을 찾지 못했습니다."
        />
      </main>
    );
  }

  return <ConditionsClient template={template} />;
}

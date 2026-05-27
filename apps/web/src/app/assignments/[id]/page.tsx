import { AssignmentOutputClient } from '@/components/AssignmentOutputClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AssignmentOutputPage({ params }: Props) {
  const { id } = await params;
  return (
    <main>
      <AssignmentOutputClient assignmentId={id} />
    </main>
  );
}

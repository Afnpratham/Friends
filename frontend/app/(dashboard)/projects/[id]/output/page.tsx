import ProjectOutputClient from './ProjectOutputClient';

export default async function ProjectOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectOutputClient projectId={id} />;
}

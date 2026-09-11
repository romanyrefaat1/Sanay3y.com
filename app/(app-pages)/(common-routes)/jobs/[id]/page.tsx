import JobDetailsClient from "./(components)/job-details-client";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function JobDetailsPage({
    params,
}: PageProps) {
    const { id } = await params;

    return <JobDetailsClient jobId={id} />;
}
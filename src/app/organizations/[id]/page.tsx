import ClientOrgAdminView from './ClientOrgAdminView';

interface OrganizationPageProps {
    params: {
        id: string;
    };
}

export default function OrganizationPage({ params }: OrganizationPageProps) {
    return <ClientOrgAdminView id={params.id} />;
} 
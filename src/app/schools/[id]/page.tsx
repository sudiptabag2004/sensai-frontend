import ClientSchoolAdminView from './ClientSchoolAdminView';

interface SchoolPageProps {
    params: {
        id: string;
    };
}

export default function SchoolPage({ params }: SchoolPageProps) {
    return <ClientSchoolAdminView id={params.id} />;
} 
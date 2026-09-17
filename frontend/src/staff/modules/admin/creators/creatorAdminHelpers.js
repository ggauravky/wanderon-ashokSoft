export const formatCreatorDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not available';
export const creatorProfileLabel = (application) => [application?.platform, application?.socialHandle].filter(Boolean).join(' · ') || 'Not provided';


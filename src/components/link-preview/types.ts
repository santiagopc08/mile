export interface LinkPreviewProps {
    url: string;
    category: 'plan' | 'antojo' | 'gusto';
    variant?: 'default' | 'square';
}

export interface PreviewData {
    title: string | null;
    image: string | null;
    description: string | null;
    siteName: string | null;
    url: string;
}

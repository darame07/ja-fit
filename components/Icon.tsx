import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6' }) => {
  const icons: { [key: string]: React.ReactNode } = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3.75M3.75 3h16.5M3.75 3v-1.5A2.25 2.25 0 016 0h12A2.25 2.25 0 0120.25 1.5v1.5M3.75 9h16.5m-16.5 4.5h16.5m-16.5-1.5h16.5m-16.5-3h16.5" />,
    nutrition: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12.75V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h9.75M8.25 6.75h3.75m-3.75 3h3.75m-3.75 3h3.75M16.5 19.5h3m-1.5-1.5v3" />,
    workouts: <><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5c-4.14 0-7.5 3.36-7.5 7.5S6.36 16.5 10.5 16.5c4.14 0 7.5-3.36 7.5-7.5S14.64 1.5 10.5 1.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></>,
    progress: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25M21 12l-3.75 2.25" />,
    weight: <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />,
    waist: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25L12 9l-3.75-3.75" />,
    target: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    camera: <><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" /></>,
    recipe: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    flame: <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-3.797z" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
    box: <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25-9 5.25M21 7.5v9l-9 5.25-9-5.25v-9M21 7.5L12 12.75 3 7.5m9 5.25v9.75" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18l-1.803-1.803.046-3.706-2.12-2.122L7.5 9l2.122-2.121.046-3.706L9 0l.813 2.096L12 3l-2.096.813-.046 3.706 2.12 2.122L9.5 9l-2.122 2.121-.046 3.706zM20.25 12l.813 2.096L24 15l-2.096.813-.046 3.706-2.12 2.122L16.5 21l-2.122-2.121-.046-3.706L15 12l2.096-.813.046-3.706 2.12-2.122L22.5 9l2.122 2.121.046 3.706L24 15l-.813 2.096zM12 3l-.813-2.096L9 0l2.096.813.046 3.706L13.5 6l2.122-2.121.046-3.706L15 0l-.813 2.096L12 3z" />,
    trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
    'clipboard-list': <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    microphone: <><path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3.75 3.75 0 00-3.75 3.75v6.75a3.75 3.75 0 007.5 0v-6.75A3.75 3.75 0 0012 1z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 4.142-3.358 7.5-7.5 7.5s-7.5-3.358-7.5-7.5" /></>,
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      {icons[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
};

export default Icon;
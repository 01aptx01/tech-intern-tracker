import type {Metadata} from 'next'; import './globals.css';
export const metadata:Metadata={title:'Tech Internship Tracker',description:'Personal Thai tech internship tracker synced with Excel'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="th"><body>{children}</body></html>}

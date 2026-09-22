import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {adminAuthorized} from '@/lib/access-policy';
import {serverConfig} from '@/lib/server-config';
import {chatGPTSignInPath} from '@/app/chatgpt-auth';
import AdminDashboard from '@/components/admin-dashboard';
export const dynamic='force-dynamic';
export const metadata={title:'GitPulse administration',robots:{index:false,follow:false}};
export default async function AdminPage(){const h=await headers();if(!await adminAuthorized(h,serverConfig())){if(h.get('oai-authenticated-user-id'))notFound();return <main className="main admin-shell"><section className="panel admin-login"><h1>GitPulse administration</h1><p>Sign in with your administrator ChatGPT account.</p><a className="primary-button" href={chatGPTSignInPath('/admin')} target="_top">Sign in with ChatGPT</a></section></main>;}return <AdminDashboard/>;}

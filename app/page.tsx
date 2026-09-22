import Dashboard from '@/components/dashboard';
import {publicData} from '@/lib/public-data';
export const dynamic='force-dynamic';
export default async function Page() { const initial=await publicData().catch(()=>undefined);return <Dashboard initial={initial}/>; }

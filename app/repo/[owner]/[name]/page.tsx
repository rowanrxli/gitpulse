import Dashboard from '@/components/dashboard';
import {publicData} from '@/lib/public-data';
export const dynamic='force-dynamic';
export default async function RepoPage({params}:{params:Promise<{owner:string,name:string}>}) {const p=await params;const initial=await publicData().catch(()=>undefined);return <Dashboard initial={initial} repoName={`${p.owner}/${p.name}`}/>}

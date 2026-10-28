export default function PublicHeading({index,kicker,title,accent,japanese,description}:{index:string;kicker:string;title:string;accent:string;japanese:string;description:string}){
  return <div className="nt-page-heading"><div className="nt-page-overline"><span>{index}</span><i/>{kicker}<span className="nt-heading-edition">NTGP 2026</span></div><div className="nt-page-title"><h1>{title} <em>{accent}</em></h1><span lang="ja">{japanese}</span></div><p>{description}</p></div>;
}

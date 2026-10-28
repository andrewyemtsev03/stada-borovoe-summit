type Props = {
  index: string;
  kicker: string;
  title: string;
  description: string;
  word: string;
  japanese: string;
};

export default function RacePageHeading({ index, kicker, title, description, word, japanese }: Props) {
  return <section className="race-page-heading" aria-label={title}>
    <div className="race-page-heading-copy">
      <p className="race-page-kicker"><span>{index}</span>{kicker} <i/> NEO TOKYO 2026</p>
      <h1>{title}</h1>
      <p className="race-page-description">{description}</p>
    </div>
    <div className="race-page-word" aria-hidden="true">{word}<small lang="ja">{japanese}</small></div>
  </section>;
}

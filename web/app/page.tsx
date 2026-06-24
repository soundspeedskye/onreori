import Link from 'next/link';
import {PixelIcon} from '@/components/ui/PixelIcon';

export default function LandingPage() {
  return (
    <main className="screen landing-screen">
      <section className="landing-visual" aria-hidden="true">
        <PixelIcon name="ticket" size={92} />
        <span className="landing-visual__float landing-visual__float--tl">
          <PixelIcon name="coffee" size={32} />
        </span>
        <span className="landing-visual__float landing-visual__float--tr">
          <PixelIcon name="bag" size={32} />
        </span>
        <span className="landing-visual__float landing-visual__float--bl">
          <PixelIcon name="mic" size={32} />
        </span>
        <span className="landing-visual__float landing-visual__float--br">
          <PixelIcon name="chat" size={32} />
        </span>
      </section>
      <section className="landing-copy">
        <p>Fan day planner</p>
        <h1>팬 이벤트 당일 준비를 한곳에서</h1>
      </section>
      <Link className="primary-link" href="/categories">
        시작하기
      </Link>
    </main>
  );
}

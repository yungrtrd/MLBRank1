import Link from "next/link";

import { Player } from "@/lib/types";

type PlayerCardProps = {
  player: Player;
};

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <article className="player-card">
      <div className="cluster">
        <span className="tag">{player.primaryRole}</span>
        <span className="tag">
          {player.debutYear}-{player.lastYear}
        </span>
      </div>
      <h3>{player.fullName}</h3>
      <p>{player.bio}</p>
      <div className="cluster">
        {player.teams.map((team) => (
          <span className="pill" key={team}>
            {team}
          </span>
        ))}
      </div>
      <div className="button-row" style={{ marginTop: 16 }}>
        <Link className="ghost-button" href={`/player/${player.slug}`}>
          View player
        </Link>
        <Link className="button" href={`/compare?players=${player.id}`}>
          Start compare
        </Link>
      </div>
    </article>
  );
}

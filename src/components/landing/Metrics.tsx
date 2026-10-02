import {
  Clock,
  Globe2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { companyContent } from "@/lib/content";
import MetricValue from "@/components/landing/MetricValue";

const { achievements } = companyContent;

/** One icon per stat, in the order the stats are declared. */
const statIcons: LucideIcon[] = [Users, Clock, TrendingUp, Globe2];

/**
 * Home page only: the proof bar directly under the hero. Deliberately quiet —
 * it is a credibility check on the way to the solutions grid, not a feature.
 * Server-rendered shell; only the figure count-up is a client island.
 */
export default function Metrics() {
  return (
    <section className="trust-strip" aria-label={achievements.label}>
      <div className="ent-shell">
        <ul className="trust-strip__row">
          {achievements.stats.map((stat, index) => {
            const Icon = statIcons[index] ?? Users;

            return (
              <li key={stat.label} className="trust-strip__item">
                <span className="trust-strip__icon" aria-hidden>
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <div className="trust-strip__text">
                  <p className="trust-strip__value-wrap">
                    <MetricValue value={stat.value} />
                  </p>
                  <p className="trust-strip__label">{stat.label}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowRight, MapPin, Search } from "lucide-react";
import IntentLink from "@/components/navigation/IntentLink";
import {
  CAREER_CATEGORIES,
  careerBranchesInUse,
  careerDepartmentsInUse,
  careerDetailHref,
  type CareerOpening,
} from "@/lib/careers/career-board";

type Props = {
  openings: CareerOpening[];
};

export default function CareerOpenings({ openings }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [branch, setBranch] = useState("");
  const [arrangement, setArrangement] = useState("");

  const categories = careerDepartmentsInUse(openings);
  const branches = careerBranchesInUse(openings);
  const arrangements = useMemo(() => {
    const set = new Set<string>();
    for (const o of openings) {
      if (o.workArrangement?.trim()) set.add(o.workArrangement.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [openings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return openings.filter((o) => {
      if (category && o.department !== category) return false;
      if (branch && !o.branches.includes(branch)) return false;
      if (arrangement && o.workArrangement !== arrangement) return false;
      if (!q) return true;
      const hay = [
        o.title,
        o.campaign ?? "",
        o.categoryLabel,
        o.excerpt,
        o.description ?? "",
        ...o.branches,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [openings, query, category, branch, arrangement]);

  const hasFilters = Boolean(query || category || branch || arrangement);

  return (
    <section
      id="openings"
      className="career-openings scroll-mt-28"
      aria-labelledby="career-openings-title"
    >
      <div className="ent-shell">
        <header className="career-openings__header">
          <p className="brand-label">Open roles</p>
          <h2 id="career-openings-title" className="career-openings__title">
            Jobs at BALITECH
          </h2>
          <p className="career-openings__lede">
            Filter on the left, then open a role on the right to read the full job description posted
            by HR.
          </p>
        </header>

        <div className="career-board">
          <aside className="career-board__filters" aria-label="Job filters">
            <p className="career-board__filters-label">Filter openings</p>

            <label className="career-openings__search">
              <span className="sr-only">Search jobs</span>
              <Search className="career-openings__search-icon" size={16} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search roles, campaigns…"
                className="career-openings__search-input"
              />
            </label>

            <label className="career-openings__select">
              <span className="career-board__field-label">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {(categories.length ? categories : CAREER_CATEGORIES).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="career-openings__select">
              <span className="career-board__field-label">Branch</span>
              <select value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>

            <label className="career-openings__select">
              <span className="career-board__field-label">Arrangement</span>
              <select value={arrangement} onChange={(e) => setArrangement(e.target.value)}>
                <option value="">All arrangements</option>
                {arrangements.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            {hasFilters && (
              <button
                type="button"
                className="career-openings__reset"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                  setBranch("");
                  setArrangement("");
                }}
              >
                Clear filters
              </button>
            )}

            <p className="career-board__count" aria-live="polite">
              {filtered.length} of {openings.length}{" "}
              {openings.length === 1 ? "opening" : "openings"}
            </p>
          </aside>

          <div className="career-board__results">
            {filtered.length === 0 ? (
              <p className="career-openings__empty">
                {openings.length === 0
                  ? "No open roles are listed right now. Check back soon, or send a general application."
                  : "No roles match these filters. Try clearing search or choosing another branch."}
              </p>
            ) : (
              <ul className="career-openings__list">
                {filtered.map((opening) => (
                  <li key={opening.id}>
                    <IntentLink
                      href={careerDetailHref(opening)}
                      className="career-job career-job--link"
                    >
                      <div className="career-job__meta">
                        <span className="career-job__category">{opening.categoryLabel}</span>
                        {opening.campaign && (
                          <span className="career-job__campaign">{opening.campaign}</span>
                        )}
                      </div>
                      <h3 className="career-job__title">{opening.title}</h3>
                      <p className="career-job__location">
                        <MapPin size={14} aria-hidden />
                        {opening.workArrangement || "On-site"}
                        {opening.workingHours ? ` · ${opening.workingHours}` : ""}
                      </p>
                      {opening.branchLabels.length > 0 && (
                        <ul className="career-job__branches" aria-label="Branches">
                          {opening.branchLabels.map((b) => (
                            <li key={b} className="career-job__branch">
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="career-job__excerpt">{opening.excerpt}</p>
                      <span className="career-job__cta">
                        View job details
                        <ArrowRight size={15} strokeWidth={2.25} aria-hidden />
                      </span>
                    </IntentLink>
                  </li>
                ))}
              </ul>
            )}

            <p className="career-openings__foot">
              Prefer a general application?{" "}
              <IntentLink href="/join-us#apply" className="career-openings__foot-link">
                Start on Join Us
              </IntentLink>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

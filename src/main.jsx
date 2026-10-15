/**
 * NOIR streaming demo
 * Main React entry point: catalog data, reusable UI, profile flows, and app state.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Info,
  Menu,
  Pencil,
  Play,
  Plus,
  Search,
  Settings,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import "./styles.css";
import "./profiles.css";
import "./auth.css";

// --- Movie catalog data and display helpers ---
// Curated starter titles provide covers and trailer links before the catalog API loads.
const movieSeeds = [{
  id: "guardians2",
  imdbID: "tt3896198",
  name: "Guardians of the Galaxy Vol. 2",
  trailerId: "dW1BIid8Osg",
  tags: ["Space adventure", "Funny", "Superheroes"]
}, {
  id: "inception",
  imdbID: "tt1375666",
  name: "Inception",
  trailerId: "Qwe6qXFTdgc",
  tags: ["Mind-bending", "Action", "Sci-Fi"]
}, {
  id: "dune2",
  imdbID: "tt15239678",
  name: "Dune: Part Two",
  trailerId: "QqmbrvluQRA",
  tags: ["Epic", "Dramatic", "Sci-Fi"]
}, {
  id: "puss2",
  imdbID: "tt3915174",
  name: "Puss in Boots: The Last Wish",
  trailerId: "xgZLXyqbYOc",
  tags: ["Family", "Adventure", "Funny"]
}, {
  id: "spiderverse",
  imdbID: "tt9362722",
  name: "Spider-Man: Across the Spider-Verse",
  trailerId: "shW9i6k8cB0",
  tags: ["Animation", "Superheroes", "Adventure"]
}, {
  id: "batman",
  imdbID: "tt1877830",
  name: "The Batman",
  trailerId: "mqqft2x_Aa4",
  tags: ["Dark", "Detective", "Action"]
}, {
  id: "interstellar",
  imdbID: "tt0816692",
  name: "Interstellar",
  trailerId: "zSWdZVtXT7E",
  tags: ["Emotional", "Space", "Sci-Fi"]
}, {
  id: "coco",
  imdbID: "tt2380307",
  name: "Coco",
  trailerId: "Rvr68u6k5sI",
  tags: ["Family", "Music", "Animation"]
}, {
  id: "knivesout",
  imdbID: "tt8946378",
  name: "Knives Out",
  trailerId: "xi-1NchUqMA",
  tags: ["Mystery", "Funny", "Ensemble"]
}, {
  id: "darkknight",
  imdbID: "tt0468569",
  name: "The Dark Knight",
  trailerId: "EXeTwQWrcwY",
  tags: ["Dark", "Action", "Superheroes"]
}];
// Searches run against OMDb to fill out the sample catalog (up to 100 movies).
const catalogQueries = [
  "avengers",
  "batman",
  "spider man",
  "star wars",
  "harry potter",
  "jurassic park",
  "mission impossible",
  "pirates of the caribbean",
  "toy story",
  "fast furious",
  "guardians galaxy",
  "dune",
  "inception",
  "coco",
  "puss boots",
];
// Friendly shelf headings used for the themed rows on the Home page.
const funnyCollectionTitles = {
  avengers: "Superheroes & Questionable Therapy",
  batman: "Billionaires After Dark",
  "spider man": "Spider-People Group Chat",
  "star wars": "Space Family Drama",
  "harry potter": "Wizard School: Safety Optional",
  "jurassic park": "Dinosaurs: What Could Go Wrong?",
  "mission impossible": "Impossible-ish Missions",
  "pirates of the caribbean": "Excellent Hats, Bad Navigation",
  "toy story": "Toys With Better Social Lives",
  "fast furious": "Family, but at 200 MPH",
  "guardians galaxy": "Space Weirdos We Love",
  dune: "Sand, Schemes & Big Worms",
  inception: "Dreams Inside Dreams",
  coco: "Songs That Wreck Us",
  "puss boots": "Cats With Too Many Lives",
  bonus: "Bonus Round: More Movies"
};
// Escapes text before it is embedded in a locally generated SVG poster.
const escapeXml = value => value.replace(/[<>&\"']/g, char => ({
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "\"": "&quot;",
  "'": "&apos;"
})[char]);
// Creates a branded fallback cover when no poster image is available.
const createPoster = (name) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 630">
      <defs>
        <linearGradient id="g" x2="0.8" y2="1">
          <stop stop-color="#292932" />
          <stop offset="1" stop-color="#09090b" />
        </linearGradient>
      </defs>
      <rect width="420" height="630" fill="url(#g)" />
      <path d="M0 425 420 180v450H0z" fill="#e50914" opacity=".22" />
      <text x="210" y="290" fill="#e50914" font-family="Arial" font-size="26" font-weight="700" text-anchor="middle">NOIR FILM</text>
      <text x="210" y="350" fill="#fff" font-family="Arial" font-size="22" text-anchor="middle">${escapeXml(name.slice(0, 34))}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
// Normalizes movie data from the seed list or an OMDb response into one app shape.
const makeMovie = (seed, data = {}) => {
  const poster =
    data.Poster && data.Poster !== "N/A"
      ? data.Poster
      : seed.trailerId
        ? `https://img.youtube.com/vi/${seed.trailerId}/hqdefault.jpg`
        : createPoster(data.Title || seed.name);
  const image = seed.trailerId ? `https://img.youtube.com/vi/${seed.trailerId}/maxresdefault.jpg` : poster;
  return {
    id: seed.id,
    imdbID: seed.imdbID,
    trailerId: seed.trailerId,
    name: data.Title || seed.name,
    year: data.Year || "2024",
    maturity: data.Rated && data.Rated !== "N/A" ? data.Rated : "PG-13",
    genre: data.Genre && data.Genre !== "N/A" ? data.Genre : "Adventure",
    rating: data.imdbRating && data.imdbRating !== "N/A" ? `${data.imdbRating} IMDb` : "Popular pick",
    description:
      data.Plot && data.Plot !== "N/A"
        ? data.Plot
        : "A fan-favorite movie. Watch the official trailer and explore the details.",
    image,
    poster,
    tags: seed.tags,
    category: "Movies",
    detailsLoaded: Boolean(data.Plot && data.Plot !== "N/A")
  };
};
// Adapts a search result and keeps known trailer metadata when it is available.
const makeSearchMovie = (result, collection) => {
  const known = movieSeeds.find(seed => seed.imdbID === result.imdbID);
  const seed = known || {
    id: result.imdbID,
    imdbID: result.imdbID,
    name: result.Title,
    trailerId: "",
    tags: [collection],
    category: "Movies"
  };
  return {
    ...makeMovie(seed, result),
    collection
  };
};
// Initial catalog used immediately while external movie searches are pending.
const titles = movieSeeds.map(seed => ({
  ...makeMovie(seed),
  collection: "bonus"
}));
// Opens the curated trailer, falling back to a YouTube search for unknown titles.
function openTrailer(item) {
  const url = item.trailerId
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(item.trailerId)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.name} official trailer`)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
// --- Shared app configuration ---
const navItems = ["Home", "Films", "My List"];
// Demo notices populate the notification popover and its read/unread controls.
const mockNotifications = [{
  id: "new-movies",
  title: "The movie shelf got bigger",
  message: "Fresh covers have landed. Your scrolling plans are safe for now.",
  time: "Just now"
}, {
  id: "movie-pick",
  title: "A pick for movie night",
  message: "Guardians of the Galaxy Vol. 2 is ready when the snacks are.",
  time: "2 hr ago"
}, {
  id: "watchlist-nudge",
  title: "Your watch pile says hi",
  message: "There are plenty of stories waiting in My List.",
  time: "Yesterday"
}];
// Profile avatar palette and default profiles used for a fresh browser session.
const profileColors = ["#2f7e76", "#7248a5", "#bc5b39", "#3979ae", "#bd9a32"];
const initialProfiles = [{
  id: "profile-alex",
  name: "Alex",
  color: 0,
  kids: false
}, {
  id: "profile-family",
  name: "Family",
  color: 2,
  kids: true
}];

// Shared NOIR wordmark; the nav instance opens the sign-in page.
function Brand({
  small = false,
  onClick
}) {
  const className = `brand ${small ? "brand-small" : ""}${onClick ? " brand-button" : ""}`;
  const content = <>NOIR<span className="brand-dot">.</span></>;
  return onClick ? (
    <button
      type="button"
      className={className}
      aria-label="Open sign in page"
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <span className={className} aria-label="Noir home">
      {content}
    </span>
  );
}
// Top navigation, search, rating-mode switch, and notification popover.
function Header({
  active,
  setActive,
  onToggleKidsMode,
  onOpenLogin,
  query,
  setQuery,
  watchlistCount,
  onOpenProfiles,
  profile,
  readNotificationIds,
  onMarkRead,
  onMarkAllRead
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const unreadCount = mockNotifications.filter(notice => !readNotificationIds.includes(notice.id)).length;
  useEffect(() => {
    if (!notificationsOpen) return;
    const onPointerDown = event => {
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const onKeyDown = event => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationsOpen]);
  return (
    <header className="topbar">
      <div className="nav-left">
        <button className="mobile-menu icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>
          <Menu size={21} />
        </button>
        <Brand
          onClick={() => {
            setQuery("");
            setSearchOpen(false);
            setMenuOpen(false);
            onOpenLogin();
          }}
        />
        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
          {navItems.map(item => <button key={item} className={`nav-link ${active === item ? "selected" : ""}`} onClick={() => {
          setActive(item);
          setMenuOpen(false);
        }}>
              {item}
              {item === "My List" && watchlistCount > 0 && <span className="nav-count">{watchlistCount}</span>}
            </button>)}
        </nav>
      </div>
      <div className="nav-actions">
        <div className={`search-box ${searchOpen ? "search-expanded" : ""}`}>
          <button className="icon-btn" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={19} />
          </button>
          {searchOpen && (
            <input
              autoFocus
              placeholder="Titles, people, genres"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Escape" && (setSearchOpen(false), setQuery(""))
              }
            />
          )}
          {searchOpen && <button className="icon-btn close-search" aria-label="Close search" onClick={() => {
          setSearchOpen(false);
          setQuery("");
        }}>
              <X size={16} />
            </button>}
        </div>
        <button
          className="kids-link"
          onClick={onToggleKidsMode}
          aria-label={`Switch to ${active === "Kids" ? "mature" : "kids"} ratings`}
        >
          {active === "Kids" ? "Mature" : "Kids"}
        </button>
        <div className="notifications-wrapper" ref={notificationsRef}>
          <button
            className="icon-btn notification"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            onClick={() => setNotificationsOpen((open) => !open)}
          >
            <Bell size={19} />
            {unreadCount > 0 && <i />}
          </button>
          {notificationsOpen && (
            <section
              className="notification-popover"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="notification-popover-heading">
                <div>
                  <h2>Notifications</h2>
                  <span>
                    {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
                  </span>
                </div>
                <button disabled={!unreadCount} onClick={onMarkAllRead}>
                  Mark all as read
                </button>
              </div>
              <div className="notification-list">
                {mockNotifications.map((notice) => {
                  const isRead = readNotificationIds.includes(notice.id);
                  return (
                    <article
                      className={`notification-item ${isRead ? "notification-read" : "notification-unread"}`}
                      key={notice.id}
                    >
                      <span className="notification-item-icon">
                        <Bell size={16} />
                      </span>
                      <div className="notification-item-copy">
                        <h3>{notice.title}</h3>
                        <p>{notice.message}</p>
                        <time>{notice.time}</time>
                      </div>
                      {!isRead && (
                        <button
                          className="mark-read-button"
                          onClick={() => onMarkRead(notice.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
        <button className="profile-btn" aria-label="Manage profiles" onClick={onOpenProfiles}>
          <span className="avatar" style={{
          background: profile ? profileColors[profile.color] : undefined
        }}>
            {profile?.name?.[0]?.toUpperCase() || "A"}
          </span>
          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
// Featured title banner with play, details, and My List actions.
function Hero({
  title,
  onPlay,
  onInfo,
  saved,
  toggleSave
}) {
  return <section className="hero" style={{
    "--hero-image": `url("${title.image}")`
  }}>
      <div className="hero-image" />
      <div className="hero-content">
        <div className="original-label">
          <span className="original-mark">N</span>
          <span>
            NOIR <b>MOVIE SPOTLIGHT</b>
          </span>
        </div>
        <h1>{title.name}</h1>
        <div className="hero-meta">
          <span className="match-score">{title.rating}</span>
          <span>{title.year}</span>
          <span className="maturity">{title.maturity}</span>
          <span>{title.seasons}</span>
          <span className="ultra">4K</span>
        </div>
        <p>{title.description}</p>
        <div className="hero-buttons">
          <button className="button button-play" onClick={() => onPlay(title)}>
            <Play size={19} fill="currentColor" />
            Play
          </button>
          <button className="button button-more" onClick={() => onInfo(title)}>
            <Info size={20} />
            More Info
          </button>
          <button
            className={`hero-save ${saved ? "is-saved" : ""}`}
            onClick={() => toggleSave(title)}
            aria-label={saved ? "Remove from my list" : "Add to my list"}
          >
            {saved ? <Check size={20} /> : <Plus size={21} />}
          </button>
        </div>
      </div>
      <div className="hero-caption">
        <span className="caption-bar" />
        <span>
          Because you watched <b>Dark Matter</b>
        </span>
      </div>
      <div className="hero-bottom-fade" />
    </section>;
}
// Reusable movie cover with optional rank, saved, and reaction indicators.
function Card({
  item,
  onSelect,
  rank,
  saved = false,
  reaction
}) {
  return (
    <button
      className={`title-card ${rank ? "rank-card" : ""}`}
      onClick={() => onSelect(item)}
      aria-label={`View ${item.name}${saved ? ", in My List" : ""}`}
    >
      {rank && <span className="rank-number">{rank}</span>}
      <img src={item.poster} alt="" loading="lazy" />
      <span className="card-shade" />
      <span className="card-title">{item.name}</span>
      {reaction && (
        <span
          className={`card-reaction-indicator card-reaction-${reaction}`}
          title={reaction === "like" ? "You like this" : "You dislike this"}
          aria-label={reaction === "like" ? "You like this" : "You dislike this"}
        >
          {reaction === "like" ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />}
        </span>
      )}
      {saved && (
        <span
          className="card-list-indicator"
          title="In My List"
          aria-label="In My List"
        >
          <Check size={15} strokeWidth={3} />
        </span>
      )}
      {rank && <span className="top-badge">TOP 10</span>}
    </button>
  );
}
// Horizontally scrolling shelf used on the Home page.
function Row({
  title,
  items,
  onSelect,
  rank = false,
  isSaved,
  reactions
}) {
  const ref = useRef(null);
  const scroll = dir => ref.current?.scrollBy({
    left: dir * Math.max(420, ref.current.clientWidth * 0.78),
    behavior: "smooth"
  });
  return (
    <section className="shelf">
      <div className="shelf-head">
        <h2>{title}</h2>
        <button className="see-all">
          Explore all <ChevronRight size={15} />
        </button>
      </div>
      <div className="row-wrap">
        <button className="row-arrow row-left" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)}>
          <ChevronLeft />
        </button>
        <div className="card-row" ref={ref}>
          {items.map((item, index) => (
            <Card
              key={`${title}-${item.id}`}
              item={item}
              onSelect={onSelect}
              rank={rank ? index + 1 : null}
              saved={isSaved?.(item) || false}
              reaction={reactions?.[item.id]}
            />
          ))}
        </div>
        <button className="row-arrow row-right" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)}>
          <ChevronRight />
        </button>
      </div>
    </section>
  );
}
// Movie detail overlay with trailer, watch-list, and like/dislike actions.
function DetailModal({
  item,
  onClose,
  saved,
  toggleSave,
  reaction,
  onReact
}) {
  if (!item) return null;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} details`}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <div
          className="modal-art"
          style={{
            "--modal-image": `url("${item.image}")`,
            "--poster-image": `url("${item.poster}")`,
          }}
        >
          <div className="modal-cover-art" aria-hidden="true" />
          <div className="modal-art-content">
            <span className="original-label">
              <span className="original-mark">N</span>
              <span>
                NOIR <b>FEATURE</b>
              </span>
            </span>
            <h2>{item.name}</h2>
            <button
              className="button button-play"
              onClick={() => openTrailer(item)}
            >
                <Play size={17} fill="currentColor" />
                Play
            </button>
          </div>
        </div>
        <div className="modal-info">
          <div className="modal-copy">
            <div className="modal-meta">
              <span className="match-score">{item.rating}</span>
              <span>{item.year}</span>
              <span className="maturity">{item.maturity}</span>
              <span>{item.seasons || "Movie"}</span>
              <span className="ultra">HD</span>
            </div>
            <p>{item.description}</p>
            <div className="genre-line">
              <span>Genres:</span> {item.genre || "Drama"},{" "}
              {item.tags?.slice(0, 2).join(", ") || "Suspenseful"}
            </div>
            <div className="genre-line">
              <span>This show is:</span>{" "}
              {item.tags?.join(", ") || "Atmospheric, Emotional"}
            </div>
          </div>
          <div className="modal-actions">
            <button
              onClick={() => toggleSave(item)}
              aria-label={saved ? "Remove from list" : "Add to list"}
            >
              {saved ? <Check /> : <Plus />}
            </button>
            <button
              className={reaction === "like" ? "reaction-selected" : ""}
              aria-label={reaction === "like" ? "Remove like" : "Like this movie"}
              aria-pressed={reaction === "like"}
              onClick={() => onReact(item, "like")}
            >
              <ThumbsUp />
            </button>
            <button
              className={reaction === "dislike" ? "reaction-selected" : ""}
              aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike this movie"}
              aria-pressed={reaction === "dislike"}
              onClick={() => onReact(item, "dislike")}
            >
              <ThumbsDown />
            </button>
            <button aria-label="More information">
              <CircleHelp />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
// Shared footer for the signed-in browsing experience.
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-social">◉　◎　◌　▶</div>
      <div className="footer-grid">
        {[
          "Audio Description",
          "Help Center",
          "Gift Cards",
          "Media Center",
          "Investor Relations",
          "Jobs",
          "Terms of Use",
          "Privacy",
          "Legal Notices",
          "Cookie Preferences",
          "Corporate Information",
          "Contact Us",
        ].map((label) => (
          <a key={label} href="#" onClick={(event) => event.preventDefault()}>
            {label}
          </a>
        ))}
      </div>
      <button className="service-code">Service Code</button>
      <p>© 2025 NOIR, Inc.</p>
    </footer>
  );
}
// Create or edit a profile, including avatar color and kids-mode preference.
function ProfileForm({
  profile,
  onClose,
  onSave,
  onDelete
}) {
  const [name, setName] = useState(profile?.name || "");
  const [color, setColor] = useState(profile?.color ?? 0);
  const [kids, setKids] = useState(profile?.kids || false);
  const [error, setError] = useState("");
  const submit = event => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter a profile name.");
      return;
    }
    onSave({
      ...profile,
      id: profile?.id || `profile-${Date.now()}`,
      name: name.trim(),
      color,
      kids
    });
  };
  return (
    <div
      className="profile-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="profile-form" onSubmit={submit}>
        <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <div className="profile-form-title">
          <span>{profile ? "Edit Profile" : "Add Profile"}</span>
          <p>
            {profile ? "Update this profile’s name, look, and viewing settings." : "Create a profile for someone who watches NOIR."}
          </p>
        </div>
        <div className="profile-form-body">
          <div className="profile-preview" style={{
          background: profileColors[color]
        }}>
            {name.trim()?.[0]?.toUpperCase() || <span>?</span>}
          </div>
          <div className="profile-fields">
            <label className="field-label" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              maxLength="24"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Profile name"
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <span className="field-label avatar-label">
              Choose an avatar color
            </span>
            <div className="avatar-colors">
              {profileColors.map((fill, index) => (
                <button
                  type="button"
                  key={fill}
                  className={`avatar-color ${color === index ? "color-selected" : ""}`}
                  style={{ background: fill }}
                  aria-label={`Avatar color ${index + 1}`}
                  onClick={() => setColor(index)}
                >
                  {color === index && <Check size={17} />}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="kids-setting">
          <input type="checkbox" checked={kids} onChange={event => setKids(event.target.checked)} />
          <span>
            <b>Kids profile</b>
            <small>Only show family-friendly series and movies.</small>
          </span>
        </label>
        <div className="profile-form-actions">
          <button className="profile-save" type="submit">
            Save
          </button>
          {profile && <button className="profile-delete" type="button" onClick={() => onDelete(profile)}>
              Delete Profile
            </button>}
          <button className="profile-cancel" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
// Profile chooser, profile manager, and sign-out controls.
function ProfilesPage({
  profiles,
  activeProfileId,
  onSelect,
  onAdd,
  onEdit,
  onBack,
  onLogOut
}) {
  const [managing, setManaging] = useState(false);
  const [editing, setEditing] = useState(null);
  const addProfile = () => {
    if (profiles.length < 5) setEditing({
      mode: "add"
    });
  };
  return (
    <main className="profiles-page">
      <button className="profiles-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to browsing
      </button>
      <div className="profiles-content">
        <div className="profiles-brand">
          <Brand />
        </div>
        <p className="profiles-eyebrow">YOUR SPACE, YOUR STORIES</p>
        <h1>Who's going on an adventure?</h1>
        <p className="profiles-subtitle">
          Choose a profile to continue or create one of your own.
        </p>
        <div className="profile-grid">
          {profiles.map((profile) => (
            <div className="profile-tile" key={profile.id}>
              <button
                className="profile-select"
                onClick={() => (managing ? setEditing(profile) : onSelect(profile))}
                aria-label={`${managing ? "Edit" : "Choose"} ${profile.name} profile`}
              >
                <span className="profile-avatar-large" style={{
              background: profileColors[profile.color]
            }}>
                  {profile.name[0]?.toUpperCase()}
                </span>
                <span className="profile-name">{profile.name}</span>
                {profile.kids && <span className="profile-kids">KIDS</span>}
                <span className="profile-tile-action">
                  {managing ? <>
                      <Pencil size={14} /> Edit
                    </> : profile.id === activeProfileId ? "Current profile" : "Select profile"}
                </span>
              </button>
            </div>
          ))}
          {profiles.length < 5 && (
            <button className="profile-add-tile" onClick={addProfile}>
              <span className="profile-add-icon">
                <Plus size={38} strokeWidth={1.5} />
              </span>
              <span>Add Profile</span>
              <small>{profiles.length} of 5 profiles</small>
            </button>
          )}
        </div>
        <div className="profiles-footer-actions">
          <button
            className={`manage-profiles ${managing ? "manage-active" : ""}`}
            onClick={() => {
              setManaging(!managing);
              setEditing(null);
            }}
          >
            {managing ? "Done" : "Manage Profiles"}
          </button>
          <span>{profiles.length} / 5 profiles</span>
          <button className="profiles-sign-out" onClick={onLogOut}>
            Sign Out
          </button>
        </div>
      </div>
      {editing && (
        <ProfileForm
          key={editing.mode === "add" ? "add-profile" : editing.id}
          profile={editing.mode === "add" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(profile) => {
            onAdd(profile);
            setEditing(null);
            setManaging(false);
          }}
          onDelete={(profile) => {
            onEdit({ ...profile, _delete: true });
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}
// Public welcome page and browser-local demo sign-up/sign-in forms.
function LandingPage({
  onAuthenticate,
  initialMode = null
}) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const samplePosters = [...titles, ...titles.slice(0, 4)];
  // Opens the selected authentication form and clears any earlier error.
  const openAuth = (mode) => {
    setError("");
    setAuthMode(mode);
  };
  // Hashes passwords before storing demo account records in this browser.
  const digestPassword = async (value) => {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  };
  // Validates demo credentials and starts a local browser session.
  const submitAuth = async (event) => {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const accounts = JSON.parse(localStorage.getItem("noir-demo-accounts") || "{}");
      const passwordHash = await digestPassword(password);
      if (authMode === "signup") {
        if (accounts[normalizedEmail]) {
          setError("An account with this email already exists. Sign in instead.");
          return;
        }
        accounts[normalizedEmail] = {
          passwordHash
        };
        localStorage.setItem("noir-demo-accounts", JSON.stringify(accounts));
      } else if (!accounts[normalizedEmail] || accounts[normalizedEmail].passwordHash !== passwordHash) {
        setError("That email and password don't match an account yet.");
        return;
      }
      localStorage.setItem("noir-session", normalizedEmail);
      onAuthenticate();
    } catch {
      setError("We couldn't complete that request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="landing-page">
      <div className="landing-backdrop" aria-hidden="true">
        <div className="landing-poster-wall">
          {samplePosters.map((movie, index) => (
            <img key={`${movie.id}-${index}`} src={movie.poster} alt="" />
          ))}
        </div>
      </div>
      <div className="landing-vignette" />
      <header className="landing-header">
        <Brand />
        <div className="landing-header-actions">
          <label className="landing-language">
            <span className="sr-only">Language</span>
            <select defaultValue="English">
              <option>English</option>
              <option>Español</option>
            </select>
          </label>
          <button className="landing-sign-in" onClick={() => openAuth("login")}>
            Sign In
          </button>
        </div>
      </header>
      <section className="landing-hero">
        <span className="landing-kicker">A universe of stories, one place</span>
        <h1>Movies and shows<br />worth staying in for.</h1>
        <p className="landing-intro">
          Find your next favorite, build your watch list, and make every movie night count.
        </p>
        <div className="landing-cta">
          <button className="landing-get-started" onClick={() => openAuth("signup")}>
            Get Started <ChevronRight size={21} />
          </button>
          <span>Start watching in just a few steps.</span>
        </div>
        <div className="landing-scroll-cue">
          <span /> Scroll to explore
        </div>
      </section>
      <section className="landing-features">
        <div>
          <span className="landing-feature-number">01</span>
          <h2>Stories for every mood</h2>
          <p>Browse a growing collection, grouped by genre and ready for your next night in.</p>
        </div>
        <div>
          <span className="landing-feature-number">02</span>
          <h2>Your list, your way</h2>
          <p>Save the films you want to see and sort your watch pile whenever inspiration strikes.</p>
        </div>
        <div>
          <span className="landing-feature-number">03</span>
          <h2>Room for everyone</h2>
          <p>Create up to five profiles, each with its own name, look, and viewing mode.</p>
        </div>
      </section>
      <footer className="landing-footer">
        <Brand small />
        <span>NOIR is a movie discovery demo. Find something good to watch.</span>
      </footer>
      {authMode && (
        <div
          className="auth-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && setAuthMode(null)}
        >
        <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="auth-close" aria-label="Close" onClick={() => setAuthMode(null)}>
            <X size={20} />
          </button>
          <Brand small />
          <h2 id="auth-title">{authMode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p>{authMode === "signup" ? "A better movie night starts here." : "Sign in to pick up where you left off."}</p>
          <form onSubmit={submitAuth}>
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
              minLength={6}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
            />
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" disabled={submitting}>
              {submitting
                ? "One moment…"
                : authMode === "signup"
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>
          <div className="auth-switch">
            {authMode === "signup" ? "Already have an account?" : "New to NOIR?"}
            <button onClick={() => openAuth(authMode === "signup" ? "login" : "signup")}>
              {authMode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </div>
          <small className="auth-demo-note">Demo sign-in is stored in this browser only.</small>
        </section>
        </div>
      )}
    </main>
  );
}
// Genre-grouped film browser with title, year, and rating sorting.
function FilmsView({
  items,
  query,
  isSaved,
  loadingGenres,
  onSelect,
  reactions
}) {
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("title");
  const getGenres = (item) =>
    (item.genre || "Other")
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
  const genres = [...new Set(items.flatMap(getGenres))].sort((a, b) => a.localeCompare(b));
  const filtered = items.filter(
    (item) =>
      (!query || `${item.name} ${item.genre}`.toLowerCase().includes(query.toLowerCase())) &&
      (genreFilter === "all" || getGenres(item).includes(genreFilter)),
  );
  const orderedGenres = genreFilter === "all" ? genres : [genreFilter];
  const sortItems = (movies) =>
    [...movies].sort((a, b) => {
      if (sortBy === "year") return Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10);
      if (sortBy === "rating") {
        return (Number.parseFloat(b.rating) || 0) - (Number.parseFloat(a.rating) || 0);
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <section className="films-page">
      <div className="films-heading">
        <span className="my-list-kicker">THE NOIR MOVIE SHELF</span>
        <h1>
          Films <span>{filtered.length}</span>
        </h1>
        <p>Sorted into genres, so the scrolling has a plot.</p>
      </div>
      <div className="films-toolbar">
        <span>
          {filtered.length} movies across {genres.length} genres
        </span>
        <div className="films-controls">
          <label>
            Genre
            <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="all">All genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort titles
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="title">A to Z</option>
              <option value="year">Newest first</option>
              <option value="rating">IMDb rating</option>
            </select>
          </label>
        </div>
      </div>
      {loadingGenres ? (
        <div className="films-loading">
          <span className="loading-spinner" />
          Getting the genre labels straight…
        </div>
      ) : filtered.length ? (
        orderedGenres.map((genre) => {
          const movies = sortItems(filtered.filter((item) => getGenres(item).includes(genre)));
          if (!movies.length) return null;

          return (
            <section className="genre-shelf" key={genre}>
              <div className="genre-shelf-heading">
                <h2>{genre}</h2>
                <span>
                  {movies.length} {movies.length === 1 ? "film" : "films"}
                </span>
              </div>
              <div className="films-flex">
                {movies.map((movie) => (
                  <Card
                    key={movie.id}
                    item={movie}
                    onSelect={onSelect}
                    saved={isSaved(movie)}
                    reaction={reactions[movie.id]}
                  />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <div className="my-list-empty">
          <span className="empty-plus">⌕</span>
          <h2>No films in this genre</h2>
          <p>Try another genre or search.</p>
        </div>
      )}
    </section>
  );
}
// Flexbox My List page with genre filters and configurable sorting.
function MyListView({
  items,
  query,
  onSelect,
  reactions
}) {
  const [sortBy, setSortBy] = useState("added");
  const [sortOrder, setSortOrder] = useState("desc");
  const [genre, setGenre] = useState("all");
  const genres = [
    ...new Set(
      items.flatMap((item) =>
        (item.genre || "")
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      ),
    ),
  ].sort();
  const visible = items
    .filter(
      (item) =>
        !query || `${item.name} ${item.genre}`.toLowerCase().includes(query.toLowerCase()),
    )
    .filter(
      (item) =>
        genre === "all" || (item.genre || "").split(",").some((entry) => entry.trim() === genre),
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") comparison = a.name.localeCompare(b.name);
      if (sortBy === "year") {
        comparison = Number.parseInt(a.year, 10) - Number.parseInt(b.year, 10);
      }
      if (sortBy === "rating") {
        comparison = Number.parseFloat(a.rating) - Number.parseFloat(b.rating);
      }
      if (sortBy === "added") comparison = items.indexOf(a) - items.indexOf(b);
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <section className="my-list-page">
      <div className="my-list-heading">
        <div>
          <span className="my-list-kicker">YOUR PERSONAL WATCH PILE</span>
          <h1>
            My List <span>{visible.length}</span>
          </h1>
          <p>For the nights when “what should we watch?” takes longer than the movie.</p>
        </div>
      </div>
      <div className="my-list-toolbar">
        <div className="my-list-count">
          {visible.length} {visible.length === 1 ? "movie" : "movies"} saved
        </div>
        <div className="my-list-controls">
          <label>
            Genre
            <select value={genre} onChange={(event) => setGenre(event.target.value)}>
              <option value="all">All genres</option>
              {genres.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setSortOrder(event.target.value === "added" ? "desc" : "asc");
              }}
            >
              <option value="added">Recently added</option>
              <option value="title">Title</option>
              <option value="year">Release year</option>
              <option value="rating">IMDb rating</option>
            </select>
          </label>
          <button
            className="sort-direction"
            onClick={() => setSortOrder((order) => (order === "asc" ? "desc" : "asc"))}
            aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
          >
            {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
          </button>
        </div>
      </div>
      {visible.length ? (
        <div className="my-list-flex">
          {visible.map((item) => (
            <Card
              key={item.id}
              item={item}
              onSelect={onSelect}
              saved
              reaction={reactions[item.id]}
            />
          ))}
        </div>
      ) : (
        <div className="my-list-empty">
          <span className="empty-plus">＋</span>
          <h2>
            {items.length
              ? "Nothing in this sort, somehow."
              : "Your watch pile is looking suspiciously organized."}
          </h2>
          <p>
            {items.length
              ? "Try another search or genre filter."
              : "Add movies with the plus button and future-you can figure it out."}
          </p>
        </div>
      )}
    </section>
  );
}
// Root app: browser persistence, API loading, routing, and page composition.
function App() {
  // --- Persistent session and user preferences ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem("noir-session")));
  const [authPage, setAuthPage] = useState(() => window.location.pathname === "/login");
  const [active, setActive] = useState("Home");
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState(titles);
  const [genreMetadataLoading, setGenreMetadataLoading] = useState(false);
  const genreLookups = useRef(new Set());
  const genreLookupJobs = useRef(0);
  const [selected, setSelected] = useState(null);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("noir-watchlist") || "[]");
    } catch {
      return [];
    }
  });
  const [reactions, setReactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("noir-reactions") || "{}");
    } catch {
      return {};
    }
  });
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("noir-read-notifications") || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [profiles, setProfiles] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("noir-profiles"));
      return Array.isArray(stored) && stored.length ? stored.slice(0, 5) : initialProfiles;
    } catch {
      return initialProfiles;
    }
  });
  const [activeProfileId, setActiveProfileId] = useState(() => localStorage.getItem("noir-active-profile") || "profile-alex");
  const [profilesPage, setProfilesPage] = useState(() => window.location.pathname === "/profiles");
  // Load a broader catalog from OMDb and merge in curated titles/trailers.
  useEffect(() => {
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) return;
    const controller = new AbortController();
    Promise.all(catalogQueries.map(async collection => {
      try {
        const params = new URLSearchParams({
          apikey: apiKey,
          s: collection,
          type: "movie",
          page: "1",
          r: "json"
        });
        const response = await fetch(`https://www.omdbapi.com/?${params}`, {
          signal: controller.signal
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.Response === "True" ? (data.Search || []).map(result => makeSearchMovie(result, collection)) : [];
      } catch (error) {
        if (error.name !== "AbortError") console.warn(`OMDb search failed for ${collection}.`, error);
        return [];
      }
    })).then(groups => {
      if (controller.signal.aborted) return;
      const unique = new Map();
      groups.flat().forEach(movie => {
        if (movie.imdbID && !unique.has(movie.imdbID)) unique.set(movie.imdbID, movie);
      });
      movieSeeds.forEach(seed => {
        if (!unique.has(seed.imdbID)) unique.set(seed.imdbID, makeMovie(seed));
      });
      setCatalog([...unique.values()].slice(0, 100));
    });
    return () => controller.abort();
  }, []);
  // Load full OMDb genre/details only when the Films view is opened.
  useEffect(() => {
    if (active !== "Films") return;
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey) return;
    const pending = catalog.filter(movie => !movie.detailsLoaded && movie.imdbID && !genreLookups.current.has(movie.id));
    if (!pending.length) return;
    pending.forEach(movie => genreLookups.current.add(movie.id));
    genreLookupJobs.current += 1;
    setGenreMetadataLoading(true);
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < pending.length) {
        const item = pending[nextIndex++];
        try {
          const params = new URLSearchParams({
            apikey: apiKey,
            i: item.imdbID,
            plot: "short",
            r: "json"
          });
          const response = await fetch(`https://www.omdbapi.com/?${params}`);
          const data = response.ok ? await response.json() : null;
          if (data?.Response === "True") {
            const seed = movieSeeds.find(movie => movie.imdbID === item.imdbID) || item;
            const details = {
              ...makeMovie(seed, data),
              collection: item.collection,
              detailsLoaded: true
            };
            setCatalog(current => current.map(movie => movie.id === item.id ? details : movie));
          }
        } catch (error) {
          console.warn(`Could not load genre details for ${item.name}.`, error);
        }
      }
    };
    Promise.all(Array.from({
      length: Math.min(4, pending.length)
    }, worker)).finally(() => {
      genreLookupJobs.current -= 1;
      if (genreLookupJobs.current === 0) setGenreMetadataLoading(false);
    });
  }, [active, catalog.length]);
  // --- Local navigation and profile management ---
  const activeProfile = profiles.find(profile => profile.id === activeProfileId) || profiles[0];
  const navigateProfiles = open => {
    const url = open ? "/profiles" : "/";
    window.history.pushState({}, "", url);
    setProfilesPage(open);
    setAuthPage(false);
  };
  const navigateLogin = () => {
    window.history.pushState({}, "", "/login");
    setAuthPage(true);
    setProfilesPage(false);
  };
  const finishAuthentication = () => {
    setIsAuthenticated(true);
    setAuthPage(false);
    window.history.replaceState({}, "", "/");
  };
  const logOut = () => {
    localStorage.removeItem("noir-session");
    setIsAuthenticated(false);
    setProfilesPage(false);
    window.history.replaceState({}, "", "/");
  };
  useEffect(() => {
    const onPopState = () => {
      setProfilesPage(window.location.pathname === "/profiles");
      setAuthPage(window.location.pathname === "/login");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  // Writes profile edits to React state and browser storage.
  const updateProfiles = next => {
    setProfiles(next);
    localStorage.setItem("noir-profiles", JSON.stringify(next));
  };
  const saveProfile = profile => {
    const profileExists = profiles.some((item) => item.id === profile.id);
    const next = profileExists
      ? profiles.map((item) => (item.id === profile.id ? profile : item))
      : [...profiles, profile].slice(0, 5);
    updateProfiles(next);
  };
  const editProfile = profile => {
    if (profile._delete) {
      const next = profiles.filter(item => item.id !== profile.id);
      updateProfiles(next);
      if (activeProfileId === profile.id && next[0]) {
        setActiveProfileId(next[0].id);
        localStorage.setItem("noir-active-profile", next[0].id);
      }
    } else saveProfile(profile);
  };
  const selectProfile = profile => {
    setActiveProfileId(profile.id);
    localStorage.setItem("noir-active-profile", profile.id);
    setActive(profile.kids ? "Kids" : "Home");
    navigateProfiles(false);
  };
  // --- User actions and catalog selection ---
  // Adds or removes a movie from the persistent My List collection.
  const toggleSave = item => setWatchlist(current => {
    const next = current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id];
    localStorage.setItem("noir-watchlist", JSON.stringify(next));
    return next;
  });
  const isSaved = item => watchlist.includes(item.id);
  // Persists an individual notification's read state.
  const markNotificationRead = id => setReadNotificationIds(current => {
    const next = current.includes(id) ? current : [...current, id];
    localStorage.setItem("noir-read-notifications", JSON.stringify(next));
    return next;
  });
  const markAllNotificationsRead = () => {
    const next = mockNotifications.map(notice => notice.id);
    setReadNotificationIds(next);
    localStorage.setItem("noir-read-notifications", JSON.stringify(next));
  };
  // Stores one like/dislike choice per movie, toggling it off on a second click.
  const setReaction = (item, value) => setReactions(current => {
    const next = {
      ...current
    };
    if (current[item.id] === value) {
      delete next[item.id];
    } else {
      next[item.id] = value;
    }
    localStorage.setItem("noir-reactions", JSON.stringify(next));
    return next;
  });
  // Search matches movie titles and genres throughout the catalog.
  const filtered = useMemo(
    () =>
      catalog.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.genre?.toLowerCase().includes(query.toLowerCase()),
      ),
    [catalog, query],
  );
  // Opens the detail modal and fetches missing movie information on demand.
  const openItem = item => {
    setSelected(item);
    const apiKey = import.meta.env.VITE_OMDB_API_KEY;
    if (!apiKey || item.detailsLoaded || !item.imdbID) return;
    const params = new URLSearchParams({
      apikey: apiKey,
      i: item.imdbID,
      plot: "short",
      r: "json"
    });
    fetch(`https://www.omdbapi.com/?${params}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data || data.Response !== "True") return;
        const seed = movieSeeds.find((movie) => movie.imdbID === item.imdbID) || item;
        const details = {
          ...makeMovie(seed, data),
          collection: item.collection,
          detailsLoaded: true,
        };
        setCatalog((current) =>
          current.map((movie) => (movie.id === item.id ? details : movie)),
        );
        setSelected((current) => (current?.id === item.id ? details : current));
      })
      .catch((error) =>
        console.warn(`OMDb detail lookup failed for ${item.name}.`, error),
      );
  };
  // --- Page data and route rendering ---
  const collections = [...new Set(catalog.map((movie) => movie.collection || "bonus"))];
  let shelves = collections.map((collection, index) => ({
    title: funnyCollectionTitles[collection] || "A Surprise Sequel to the Watch List",
    items: catalog.filter((movie) => (movie.collection || "bonus") === collection),
    rank: index === 0,
  }));
  if (active === "Kids") {
    shelves = [
      {
        title: "Family Favorites",
        items: catalog
          .filter((movie) => /toy story|coco|puss in boots|spider-man/i.test(movie.name))
          .slice(0, 10),
      },
    ];
  }

  if (authPage || !isAuthenticated) {
    return (
      <LandingPage
        initialMode={authPage ? "login" : null}
        onAuthenticate={finishAuthentication}
      />
    );
  }

  if (profilesPage) {
    return (
      <ProfilesPage
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelect={selectProfile}
        onAdd={saveProfile}
        onEdit={editProfile}
        onBack={() => navigateProfiles(false)}
        onLogOut={logOut}
      />
    );
  }

  const myListItems = watchlist
    .map((id) => catalog.find((movie) => movie.id === id))
    .filter(Boolean);

  return (
    <div className="app-shell">
      <Header
        active={active}
        setActive={setActive}
        onToggleKidsMode={() =>
          setActive((current) => (current === "Kids" ? "Home" : "Kids"))
        }
        onOpenLogin={navigateLogin}
        query={query}
        setQuery={setQuery}
        watchlistCount={myListItems.length}
        profile={activeProfile}
        onOpenProfiles={() => navigateProfiles(true)}
        readNotificationIds={readNotificationIds}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
      />
      {active === "Films" ? (
        <main>
          <FilmsView
            items={catalog}
            query={query}
            isSaved={isSaved}
            loadingGenres={genreMetadataLoading}
            onSelect={openItem}
            reactions={reactions}
          />
        </main>
      ) : active === "My List" ? (
        <main>
          <MyListView
            items={myListItems}
            query={query}
            onSelect={openItem}
            reactions={reactions}
          />
        </main>
      ) : (
        <main>
          <Hero
            title={catalog[0]}
            onPlay={openTrailer}
            onInfo={openItem}
            saved={isSaved(catalog[0])}
            toggleSave={toggleSave}
          />
          <div className="browse-area">
            {query ? (
              <>
                <div className="search-results-label">
                  Titles matching <b>“{query}”</b>
                </div>
                {filtered.length ? (
                  <div className="search-results">
                    {filtered.map((item) => (
                      <Card
                        key={item.id}
                        item={item}
                        onSelect={openItem}
                        saved={isSaved(item)}
                        reaction={reactions[item.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No titles found. Try another search.</p>
                )}
              </>
            ) : (
              shelves.map((shelf) => (
                <Row
                  key={shelf.title}
                  title={shelf.title}
                  items={shelf.items}
                  onSelect={openItem}
                  rank={shelf.rank}
                  isSaved={isSaved}
                  reactions={reactions}
                />
              ))
            )}
          </div>
        </main>
      )}
      <Footer />
      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          saved={isSaved(selected)}
          toggleSave={toggleSave}
          reaction={reactions[selected.id]}
          onReact={setReaction}
        />
      )}
    </div>
  );
}
// Mount the app and enable React's development checks.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import { useEffect, useRef, useState } from 'react'
import data from './data/portfolio-data.json'

const { profile, hero, fit, featured, coreStack, stats, experience, projects, education } = data

const YEAR = new Date().getFullYear()
let rippleId = 0
const initials = profile.name
  .split(' ')
  .slice(0, 2)
  .map((w) => w[0])
  .join('')

// Fake fleet rows for the featured-project mockup; purely illustrative.
const MOCK_DEVICES = [
  { id: 'edge-gw-014', zone: 'on-prem', status: 'valid', expires: '312d' },
  { id: 'sensor-a7f2', zone: 'azure', status: 'rotating', expires: '6d' },
  { id: 'edge-gw-022', zone: 'azure', status: 'valid', expires: '298d' },
  { id: 'node-mcu-41', zone: 'on-prem', status: 'revoked', expires: '—' },
]
const MOCK_BARS = [38, 52, 46, 61, 58, 72, 66, 80, 74, 88, 83, 92]
const STATUS_STYLES = {
  valid: 'bg-ok/10 text-ok ring-ok/25',
  rotating: 'bg-warn/10 text-warn ring-warn/25',
  revoked: 'bg-bad/10 text-bad ring-bad/25',
}

/* ---------- primitives ---------- */

function Card({ className = '', delay = 0, children, as: Tag = 'div', ...rest }) {
  const onPointerMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
  }
  return (
    <Tag
      onPointerMove={onPointerMove}
      style={{ animationDelay: `${delay}ms` }}
      className={`spotlight animate-rise rounded-2xl border border-line bg-surface/70 backdrop-blur-xl transition-[transform,border-color] duration-500 ease-spring hover:-translate-y-0.5 hover:border-line-strong ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

function Label({ children, right }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">{children}</h2>
      {right}
    </div>
  )
}

function Pill({ children, active = false, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none transition-colors duration-300 ${
        active ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-raised/60 text-gray-300'
      } ${className}`}
    >
      {children}
    </span>
  )
}

function RippleButton({ href, variant = 'primary', children, ...rest }) {
  const [ripples, setRipples] = useState([])
  const spawn = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const size = Math.max(r.width, r.height) * 2
    const ripple = { id: ++rippleId, x: e.clientX - r.left - size / 2, y: e.clientY - r.top - size / 2, size }
    setRipples((rs) => [...rs, ripple])
  }
  const styles =
    variant === 'primary'
      ? 'bg-accent text-canvas hover:bg-accent-soft shadow-[0_0_0_0_rgb(255_126_107/0)] hover:shadow-[0_0_28px_-6px_rgb(255_126_107/0.7)]'
      : 'border border-line bg-raised/50 text-gray-200 hover:border-line-strong hover:bg-raised'
  return (
    <a
      href={href}
      onPointerDown={spawn}
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-spring active:scale-[0.97] ${styles}`}
      {...rest}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          onAnimationEnd={() => setRipples((rs) => rs.filter((x) => x.id !== r.id))}
          className={`pointer-events-none absolute animate-ripple rounded-full ${variant === 'primary' ? 'bg-white' : 'bg-accent'}`}
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
      <span className="relative">{children}</span>
    </a>
  )
}

/* ---------- hooks ---------- */

function useInView(threshold = 0.4) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen]
}

function useCountUp(target, run, duration = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!run) return
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(target * (1 - Math.pow(1 - t, 4)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, run, duration])
  return value
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })
}

/* ---------- cards ---------- */

function FitCard() {
  const [hovered, setHovered] = useState(null)
  return (
    <Card delay={90} className="p-6 sm:p-8 md:col-span-2 lg:col-span-4">
      <Label right={<span className="font-mono text-[11px] text-gray-600">requirement → evidence</span>}>{fit.title}</Label>
      <ul className="grid gap-3 sm:grid-cols-2">
        {fit.items.map((f, i) => (
          <li
            key={f.need}
            onPointerEnter={() => setHovered(i)}
            onPointerLeave={() => setHovered(null)}
            className={`rounded-xl border bg-canvas/60 p-4 transition-all duration-500 ease-spring ${
              hovered === i ? '-translate-y-0.5 border-accent/40' : 'border-line'
            }`}
          >
            <p className="flex items-start gap-2 font-mono text-[13px] font-medium text-white">
              <span
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] transition-colors duration-300 ${
                  hovered === i ? 'bg-accent text-canvas' : 'bg-accent/15 text-accent'
                }`}
              >
                ✓
              </span>
              {f.need}
            </p>
            <p className="mt-2 pl-6 text-sm leading-relaxed text-gray-400">{f.proof}</p>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 font-mono text-[11px] text-gray-600">specialties</span>
        {fit.specialties.map((s) => (
          <Pill key={s} active>
            {s}
          </Pill>
        ))}
      </div>
    </Card>
  )
}

function HeroCard() {
  return (
    <Card className="dot-grid flex flex-col justify-between overflow-hidden p-6 sm:p-8 md:col-span-2 lg:col-span-4">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">
        <span className="h-px w-6 bg-accent" />
        {profile.title}
      </div>
      <h1 className="mt-8 max-w-3xl font-mono text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
        I build <span className="bg-gradient-to-r from-accent via-[#ff9fb0] to-lilac bg-clip-text text-transparent">{hero.build}</span> that{' '}
        <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{hero.achieves}</span>.
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-400">{hero.sub}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <RippleButton href="#featured">
          See the flagship build <span aria-hidden>→</span>
        </RippleButton>
        <RippleButton href={`mailto:${profile.email}`} variant="ghost">
          {profile.email}
        </RippleButton>
      </div>
    </Card>
  )
}

function ProfileCard() {
  const time = useClock()
  return (
    <Card delay={60} className="flex flex-col p-6 md:col-span-2 lg:col-span-2">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/20 to-transparent font-mono text-lg font-bold text-accent">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-white">{profile.name}</p>
          <p className="text-sm text-gray-500">{profile.location}</p>
        </div>
      </div>
      <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-ok/25 bg-ok/10 px-3 py-1 text-xs text-ok">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
        </span>
        {profile.availability}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line font-mono text-xs">
        <div className="bg-surface p-3">
          <dt className="text-gray-500">local time</dt>
          <dd className="mt-1 text-sm text-white tabular-nums">{time} IST</dd>
        </div>
        <div className="bg-surface p-3">
          <dt className="text-gray-500">focus</dt>
          <dd className="mt-1 text-sm text-white">Python · Full-stack</dd>
        </div>
      </dl>
      <div className="mt-auto flex gap-2 pt-6">
        {profile.linkedin && (
          <RippleButton href={profile.linkedin} variant="ghost" target="_blank" rel="noreferrer">
            LinkedIn ↗
          </RippleButton>
        )}
        <RippleButton href={profile.github} variant="ghost" target="_blank" rel="noreferrer">
          GitHub ↗
        </RippleButton>
        <RippleButton href={`mailto:${profile.email}`} variant="ghost">
          Email
        </RippleButton>
      </div>
    </Card>
  )
}

function FleetMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-canvas/60 shadow-2xl shadow-black/60 transition-transform duration-700 ease-spring group-hover:-translate-y-1 group-hover:rotate-[-0.4deg]">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="ml-2 font-mono text-[10px] text-gray-600">device-trust / fleet</span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-ok">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> live
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-line">
        {[
          ['certs', '12k+'],
          ['freshness', '<5s'],
          ['false +', '0'],
        ].map(([k, v]) => (
          <div key={k} className="bg-canvas/60 px-3 py-2.5">
            <p className="font-mono text-[10px] text-gray-600">{k}</p>
            <p className="font-mono text-base font-bold text-white">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex h-16 items-end gap-1 border-y border-line px-3 py-2">
        {MOCK_BARS.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm bg-gradient-to-t from-accent/20 to-accent/70 transition-all duration-500 ease-spring group-hover:from-accent/30 group-hover:to-accent"
            style={{ height: `${h}%`, transitionDelay: `${i * 25}ms` }}
          />
        ))}
      </div>
      <ul className="divide-y divide-line font-mono text-[11px]">
        {MOCK_DEVICES.map((d) => (
          <li key={d.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2">
            <span className="truncate text-gray-300">{d.id}</span>
            <span className="hidden text-gray-600 sm:inline">{d.zone}</span>
            <span className={`rounded-full px-2 py-0.5 ring-1 ${STATUS_STYLES[d.status]}`}>{d.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeaturedCard() {
  return (
    <Card
      as="article"
      id="featured"
      delay={120}
      className="group grid scroll-mt-6 gap-8 overflow-hidden p-6 sm:p-8 md:col-span-2 lg:col-span-4 lg:grid-cols-[1fr_1.1fr]"
    >
      <div className="flex flex-col">
        <Label right={<Pill active>Featured</Pill>}>
          {featured.org} · {featured.year}
        </Label>
        <h3 className="font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">{featured.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">{featured.summary}</p>
        <ul className="mt-5 space-y-2">
          {featured.outcomes.map((o) => (
            <li key={o} className="flex items-start gap-2.5 text-sm text-gray-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {o}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
          {featured.stack.map((s) => (
            <Pill key={s}>{s}</Pill>
          ))}
        </div>
      </div>
      <div className="self-center">
        <FleetMockup />
        <p className="mt-2 text-center font-mono text-[10px] text-gray-600">illustrative preview · no production data</p>
      </div>
    </Card>
  )
}

function StackCard() {
  const [tab, setTab] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setTab((i) => (i + 1) % coreStack.length), 3800)
    return () => clearInterval(t)
  }, [paused])

  return (
    <Card
      delay={180}
      className="flex flex-col p-6 md:col-span-2 lg:col-span-2"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <Label right={<span className="font-mono text-[11px] text-gray-600">{`0${tab + 1}/0${coreStack.length}`}</span>}>
        Tech stack
      </Label>
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-canvas/60 p-1" role="tablist">
        {coreStack.map((g, i) => (
          <button
            key={g.group}
            type="button"
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
            className={`rounded-lg px-2.5 py-1.5 text-xs transition-all duration-300 ease-spring ${
              tab === i ? 'bg-raised text-white shadow-[inset_0_0_0_1px_var(--color-line-strong)]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {g.group}
          </button>
        ))}
      </div>
      <div key={tab} className="mt-5 flex flex-wrap content-start gap-2" role="tabpanel">
        {coreStack[tab].items.map((s, i) => (
          <span key={s} className="animate-pop" style={{ animationDelay: `${i * 40}ms` }}>
            <Pill className="hover:border-accent/40 hover:text-accent">{s}</Pill>
          </span>
        ))}
      </div>
      <div className="mt-auto flex gap-1 pt-6" aria-hidden>
        {coreStack.map((g, i) => (
          <span
            key={g.group}
            className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i === tab ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>
    </Card>
  )
}

function Metric({ value, label, run }) {
  const [, prefix = '', num = '0', suffix = ''] = value.match(/^(\D*)([\d,.]+)(.*)$/) ?? []
  const target = Number(num.replace(/,/g, ''))
  const current = useCountUp(target, run)
  return (
    <div className="group/metric rounded-xl border border-line bg-canvas/60 p-4 transition-colors duration-300 hover:border-accent/30">
      <p className="font-mono text-2xl font-bold text-white tabular-nums sm:text-3xl">
        <span className="text-accent">{prefix}</span>
        {Math.round(current).toLocaleString('en-US')}
        <span className="text-accent">{suffix}</span>
      </p>
      <p className="mt-1 text-xs leading-snug text-gray-500 transition-colors group-hover/metric:text-gray-400">{label}</p>
    </div>
  )
}

function MetricsCard() {
  const [ref, seen] = useInView()
  return (
    <Card delay={240} className="p-6 md:col-span-2 lg:col-span-2">
      <div ref={ref}>
        <Label>Impact metrics</Label>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <Metric key={s.label} {...s} run={seen} />
          ))}
        </div>
      </div>
    </Card>
  )
}

function ExperienceCard() {
  const timeline = [
    ...experience.map((e) => ({
      key: e.start,
      title: e.role,
      org: e.organization,
      when: `${e.start} — ${e.end}`,
      current: e.current,
      points: e.highlights,
      stack: e.stack,
    })),
  ]
  const [active, setActive] = useState(0)
  const item = timeline[active]

  return (
    <Card delay={300} className="p-6 sm:p-8 md:col-span-2 lg:col-span-4">
      <Label right={<span className="font-mono text-[11px] text-gray-600">hover to inspect</span>}>
        Work experience
      </Label>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <ol className="relative space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-line">
          {timeline.map((t, i) => {
            const on = i === active
            return (
              <li key={t.key}>
                <button
                  type="button"
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-pressed={on}
                  className={`relative flex w-full items-start gap-4 rounded-xl px-0 py-3 pr-3 text-left transition-all duration-500 ease-spring ${
                    on ? 'translate-x-1 bg-raised/60' : 'hover:bg-raised/30'
                  }`}
                >
                  <span
                    className={`relative z-10 mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all duration-500 ease-spring ${
                      on ? 'scale-110 border-accent bg-accent/15' : 'border-line-strong bg-surface'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-accent' : t.current ? 'bg-ok' : 'bg-line-strong'}`} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block font-mono text-[11px] ${on ? 'text-accent' : 'text-gray-600'}`}>{t.when}</span>
                    <span className={`mt-0.5 block text-sm font-medium ${on ? 'text-white' : 'text-gray-300'}`}>{t.title}</span>
                    <span className="block truncate text-xs text-gray-500">{t.org}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div key={item.key} className="animate-rise rounded-xl border border-line bg-canvas/60 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-base font-semibold text-white">{item.title}</h3>
            {item.current && <Pill className="border-ok/30 bg-ok/10 text-ok">current</Pill>}
          </div>
          <p className="mt-1 text-sm text-gray-500">{item.org}</p>
          <ul className="mt-4 space-y-2.5">
            {item.points.map((p) => (
              <li key={p} className="flex gap-3 text-sm leading-relaxed text-gray-400">
                <span className="mt-[9px] h-px w-3 shrink-0 bg-accent/70" />
                {p}
              </li>
            ))}
          </ul>
          {item.stack.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {item.stack.map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function EducationCard() {
  return (
    <Card delay={330} className="flex flex-col p-6 md:col-span-2 lg:col-span-2">
      <Label>Education</Label>
      <ol className="space-y-3">
        {education.map((e, i) => (
          <li
            key={e.degree}
            className="group/edu rounded-xl border border-line bg-canvas/60 p-4 transition-all duration-500 ease-spring hover:-translate-y-0.5 hover:border-lilac/40"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className={`font-mono text-[11px] ${i === 0 ? 'text-accent' : 'text-gray-500'}`}>{e.year}</span>
              {i === 0 && <Pill className="border-lilac/30 bg-lilac/10 text-lilac">degree</Pill>}
            </div>
            <p className="mt-2 text-sm font-medium leading-snug text-white">{e.degree}</p>
            <p className="mt-0.5 text-xs text-gray-500 transition-colors group-hover/edu:text-gray-400">{e.institution}</p>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function ProjectCard({ project, delay, wide }) {
  return (
    <Card as="article" delay={delay} className={`group flex flex-col p-6 lg:col-span-2 ${wide ? 'md:col-span-2' : 'md:col-span-1'}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gray-500">{project.category}</span>
        <span className="font-mono text-gray-600 transition-all duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent">
          ↗
        </span>
      </div>
      <h3 className="mt-4 font-mono text-[15px] font-semibold leading-snug text-white">{project.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{project.description}</p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-5">
        {project.tags.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>
    </Card>
  )
}

function ContactCard() {
  return (
    <Card delay={540} className="dot-grid flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center sm:p-8 md:col-span-2 lg:col-span-6">
      <div>
        <p className="font-mono text-xl font-bold text-white sm:text-2xl">
          Need software built, reviewed or stress-tested<span className="text-accent">?</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">Backend · full-stack · Python · embedded · ML. Full-time, contract or project-based.</p>
      </div>
      <RippleButton href={profile.linkedin || `mailto:${profile.email}`} target="_blank" rel="noreferrer">
        Start a conversation on LinkedIn <span aria-hidden>↗</span>
      </RippleButton>
    </Card>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="aurora-blob left-[-10%] top-[-15%] h-[520px] w-[520px] bg-accent/25" />
        <div className="aurora-blob right-[-12%] top-[10%] h-[600px] w-[600px] bg-lilac/25 [animation-delay:-8s]" />
        <div className="aurora-blob bottom-[-20%] left-[30%] h-[560px] w-[560px] bg-teal/15 [animation-delay:-16s]" />
        <div className="grain absolute inset-0" />
      </div>
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
          <HeroCard />
          <ProfileCard />
          <FitCard />
          <MetricsCard />
          <FeaturedCard />
          <StackCard />
          <ExperienceCard />
          <EducationCard />
          {projects.slice(0, 3).map((p, i) => (
            <ProjectCard key={p.name} project={p} delay={360 + i * 60} wide={i === 2} />
          ))}
          <ContactCard />
        </div>
        <footer className="mt-8 flex flex-wrap justify-between gap-2 px-1 font-mono text-[11px] text-gray-600">
          <span>
            © {YEAR} {profile.name}
          </span>
          <span>React · Vite · Tailwind</span>
        </footer>
      </main>
    </div>
  )
}

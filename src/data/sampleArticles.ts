import { Article, VoiceOption } from '../types';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    tagline: 'Clear, crisp, & expressive',
    tone: 'Confident broadcast anchor with natural warmth',
    bestFor: 'Morning news, commute anchor, tech briefing',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    tagline: 'Upbeat, energetic, & quick-witted',
    tone: 'Vibrant morning show host with lively cadence',
    bestFor: 'Duo host banter, fast-paced commute drive',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    tagline: 'Smooth, warm, & melodic',
    tone: 'Calm, thoughtful storytelling delivery',
    bestFor: 'Long train rides, thoughtful evening commutes',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    tagline: 'Authoritative, resonant, & deep',
    tone: 'Distinguished executive briefing anchor',
    bestFor: 'Financial markets, business analysis, policy',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    tagline: 'Grounding, measured, & clear',
    tone: 'Composed, steady newsroom voice',
    bestFor: 'Deep investigative dives, science reports',
  },
];

export const SAMPLE_ARTICLES: Omit<Article, 'id' | 'addedAt'>[] = [
  {
    title: 'Solid-State Battery Breakthrough Enables 750-Mile EV Range in Commercial Trials',
    source: 'Tech Horizons Daily',
    category: 'Technology',
    priority: 'deep_dive',
    content: `Automotive engineers have achieved a long-awaited commercial milestone in solid-state battery technology, reporting verified road tests exceeding 750 miles (1,200 km) on a single 12-minute charge in sub-zero winter conditions.

The breakthrough, spearheaded by a consortium of advanced materials researchers and electric mobility manufacturers, replaces volatile liquid electrolytes with a flexible ceramic-composite solid separator. This structural shift virtually eliminates battery degradation and fire hazards while packing nearly triple the energy density of conventional lithium-ion cells.

Field deployments in delivery fleets across northern climates demonstrated a 94% capacity retention after 1,000 extreme fast-charging cycles. Automotive analysts forecast that mass production runs scheduled for late 2027 will bring parity with internal combustion vehicle prices, dramatically accelerating fleet decarbonization and reducing regional charging infrastructure anxiety for daily commuters.`,
  },
  {
    title: 'AI Smart Traffic Corridors Slash Urban Commute Delays by 28% in Multi-City Pilot',
    source: 'Urban Mobility Review',
    category: 'Transit & Cities',
    priority: 'deep_dive',
    content: `A synchronized artificial intelligence traffic management grid tested across six major metropolitan hubs has reduced rush-hour commute delays by 28% while lowering idling vehicle carbon emissions by 19%, municipal transportation departments announced this morning.

Unlike legacy timed traffic lights or isolated sensor loops, the dynamic system processes real-time telemetry from transit buses, connected vehicles, and micro-mobility lanes. The neural network predicts localized bottlenecks up to 20 minutes in advance, adjusting green-wave timing dynamically to prioritize mass transit corridors and prevent gridlock at key bridge and highway interchanges.

City planners highlighted that the greatest beneficiaries were multimodal commuters transferring between commuter rail and surface transit, whose connection wait times fell by an average of eight minutes per journey. Several city councils are now drafting budget appropriations to expand the smart grid citywide ahead of next year's peak summer travel period.`,
  },
  {
    title: 'Global Four-Day Workweek Experiment Concludes: 91% of Companies Make Policy Permanent',
    source: 'Work & Economy Chronicle',
    category: 'Business & Life',
    priority: 'takeaways',
    content: `The largest multinational trial of the 32-hour four-day workweek has concluded with resounding success, as 91% of participating enterprises across 14 countries opted to retain the schedule indefinitely without reducing worker compensation.

Over the 18-month randomized research period involving 180 companies and 42,000 employees, revenue grew by an average of 14.2% relative to comparable business periods. Crucially, employee burnout scores plummeted by 67%, while sick day utilization dropped by nearly a third.

Commute patterns in participating regions experienced a notable flattening of peak Friday rush hours, shifting transit demands toward recreational and off-peak travel. Corporate leaders noted that retention rates rose to historic highs, with hiring pipelines filling 40% faster than prior cycles. Organizational psychologists attribute the gains to meeting hygiene, automated administrative workflows, and sharper cognitive focus among well-rested teams.`,
  },
  {
    title: 'Next-Generation Webb Telescope Data Uncovers Atmosphere on Earth-Sized Exoplanet',
    source: 'Astronomy & Space Today',
    category: 'Science',
    priority: 'brief',
    content: `Astrophysicists analyzing high-resolution transmission spectroscopy data from the James Webb Space Telescope have detected signatures of carbon dioxide and water vapor in the atmosphere of an Earth-sized planet orbiting a stable red dwarf star 48 light-years away.

The exoplanet, designated Proxima-G3, resides firmly within its star's habitable zone, where surface temperatures could support liquid water. While astronomers caution that further spectroscopic transits are needed to confirm atmospheric pressure and surface geology, the findings represent the most definitive evidence to date of a substantial atmosphere enveloping a rocky terrestrial world outside our solar system.

A series of dedicated deep-space observational windows has been scheduled over the coming months to probe for trace bio-signature gases like ozone and methane, sparking renewed international enthusiasm for space exploration and the search for extraterrestrial biology.`,
  },
  {
    title: 'Global Clean Energy Investments Surpass Fossil Fuels by 2-to-1 Margin in Annual Report',
    source: 'Global Energy Monitor',
    category: 'Economy & Climate',
    priority: 'takeaways',
    content: `Worldwide capital deployed into clean energy infrastructure—including utility solar, offshore wind, grid-scale storage, and green hydrogen—outpaced fossil fuel capital expenditures by more than two to one over the past calendar year, according to the International Clean Power Outlook.

Total investments reached a record $1.9 trillion, driven primarily by plunging equipment costs and expedited regulatory approvals for clean grid interconnections. Notably, rooftop solar coupled with home batteries emerged as the fastest-growing residential energy segment across Europe and North America, insulating households from wholesale electricity price spikes.

Industry economists emphasized that the economic momentum behind renewable generation is now primarily driven by market economics rather than subsidies, with unsubsidized solar generating costs dipping below two cents per kilowatt-hour in sunbelt territories.`,
  },
];

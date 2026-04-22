export interface SearchResult {
  id: string;
  filename: string;
  size: string;
  type: 'Audio' | 'Video' | 'Image' | 'Document' | 'Program';
  speed: 'T1' | 'Cable' | 'DSL' | 'Modem';
  quality: 1 | 2 | 3 | 4 | 5;
  bitrate: string;
  length: string;
  seeds: number;
  isVirus: boolean;
  realFile: string | null;
  title?: string;
  artist?: string;
}

export const SEED_RESULTS: SearchResult[] = [
  // ── Real tracks (The Killers, Britney, Radiohead) ────────────
  {
    id: 'real_brightside',
    filename: 'the_killers_mr_brightside_OFFICIAL.mp3',
    size: '6.5 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '192 kbps', length: '3:42', seeds: 1204,
    isVirus: false, realFile: '/music/mr_brightside.mp3',
    title: 'Mr. Brightside', artist: 'The Killers',
  },
  {
    id: 'real_toxic',
    filename: 'britney_spears_toxic_HD_OFFICIAL.mp3',
    size: '6.7 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '192 kbps', length: '3:20', seeds: 987,
    isVirus: false, realFile: '/music/toxic.mp3',
    title: 'Toxic', artist: 'Britney Spears',
  },
  {
    id: 'real_creep',
    filename: 'radiohead_creep_ORIGINAL.mp3',
    size: '7.7 MB', type: 'Audio', speed: 'Cable', quality: 5,
    bitrate: '192 kbps', length: '3:58', seeds: 2341,
    isVirus: false, realFile: '/music/creep.mp3',
    title: 'Creep', artist: 'Radiohead',
  },
  // ── Legit audio ──────────────────────────────────────────────
  {
    id: 'r1',
    filename: 'all_star_smashmouth_FULL_album_version.mp3',
    size: '3.4 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '128 kbps', length: '3:35', seeds: 312,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'All Star', artist: 'Smash Mouth',
  },
  {
    id: 'r2',
    filename: 'blue_da_ba_dee_eiffel65_RADIO_EDIT.mp3',
    size: '3.1 MB', type: 'Audio', speed: 'Cable', quality: 4,
    bitrate: '128 kbps', length: '3:15', seeds: 187,
    isVirus: false, realFile: '/music/blue_da_ba_dee.mp3',
    title: 'Blue (Da Ba Dee)', artist: 'Eiffel 65',
  },
  {
    id: 'r3',
    filename: 'crazy_frog_axel_f_ORIGINAL.mp3',
    size: '2.8 MB', type: 'Audio', speed: 'DSL', quality: 3,
    bitrate: '128 kbps', length: '2:56', seeds: 423,
    isVirus: false, realFile: '/music/crazy_frog.mp3',
    title: 'Axel F', artist: 'Crazy Frog',
  },
  {
    id: 'r4',
    filename: 'american_pie_madonna.mp3',
    size: '4.2 MB', type: 'Audio', speed: 'T1', quality: 4,
    bitrate: '128 kbps', length: '4:24', seeds: 95,
    isVirus: false, realFile: '/music/american_pie.mp3',
    title: 'American Pie', artist: 'Madonna',
  },
  {
    id: 'r5',
    filename: 'nelly_hot_in_herre_clean.mp3',
    size: '3.9 MB', type: 'Audio', speed: 'Cable', quality: 4,
    bitrate: '128 kbps', length: '4:05', seeds: 211,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'Hot in Herre', artist: 'Nelly',
  },
  {
    id: 'r6',
    filename: 'outkast_hey_ya.mp3',
    size: '3.6 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '128 kbps', length: '3:48', seeds: 344,
    isVirus: false, realFile: '/music/blue_da_ba_dee.mp3',
    title: 'Hey Ya!', artist: 'OutKast',
  },
  {
    id: 'r7',
    filename: 'linkin_park_in_the_end.mp3',
    size: '3.7 MB', type: 'Audio', speed: 'DSL', quality: 5,
    bitrate: '128 kbps', length: '3:37', seeds: 501,
    isVirus: false, realFile: '/music/crazy_frog.mp3',
    title: 'In the End', artist: 'Linkin Park',
  },
  {
    id: 'r8',
    filename: 'eminem_lose_yourself_CLEAN.mp3',
    size: '5.4 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '192 kbps', length: '5:38', seeds: 789,
    isVirus: false, realFile: '/music/american_pie.mp3',
    title: 'Lose Yourself', artist: 'Eminem',
  },
  {
    id: 'r9',
    filename: 'nickelback_rockstar.mp3',
    size: '3.3 MB', type: 'Audio', speed: 'Cable', quality: 3,
    bitrate: '128 kbps', length: '3:26', seeds: 88,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'Rockstar', artist: 'Nickelback',
  },
  {
    id: 'r10',
    filename: 'aqua_barbie_girl_EXTENDED.mp3',
    size: '4.5 MB', type: 'Audio', speed: 'Modem', quality: 2,
    bitrate: '128 kbps', length: '4:44', seeds: 42,
    isVirus: false, realFile: '/music/blue_da_ba_dee.mp3',
    title: 'Barbie Girl', artist: 'Aqua',
  },
  {
    id: 'r11',
    filename: 'destinys_child_independent_women.mp3',
    size: '3.8 MB', type: 'Audio', speed: 'DSL', quality: 4,
    bitrate: '128 kbps', length: '3:59', seeds: 165,
    isVirus: false, realFile: '/music/crazy_frog.mp3',
    title: "Independent Women Pt. 1", artist: "Destiny's Child",
  },
  {
    id: 'r12',
    filename: 'the_offspring_pretty_fly.mp3',
    size: '3.2 MB', type: 'Audio', speed: 'Cable', quality: 3,
    bitrate: '128 kbps', length: '3:22', seeds: 134,
    isVirus: false, realFile: '/music/american_pie.mp3',
    title: 'Pretty Fly (for a White Guy)', artist: 'The Offspring',
  },
  {
    id: 'r13',
    filename: 'spice_girls_wannabe.mp3',
    size: '3.0 MB', type: 'Audio', speed: 'T1', quality: 3,
    bitrate: '128 kbps', length: '3:08', seeds: 77,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'Wannabe', artist: 'Spice Girls',
  },
  {
    id: 'r14',
    filename: 'backstreet_boys_i_want_it_that_way.mp3',
    size: '3.5 MB', type: 'Audio', speed: 'Cable', quality: 4,
    bitrate: '128 kbps', length: '3:34', seeds: 248,
    isVirus: false, realFile: '/music/blue_da_ba_dee.mp3',
    title: 'I Want It That Way', artist: 'Backstreet Boys',
  },
  {
    id: 'r15',
    filename: 'kids_bop_all_star_2003.mp3',
    size: '3.1 MB', type: 'Audio', speed: 'Modem', quality: 1,
    bitrate: '96 kbps', length: '3:10', seeds: 14,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'All Star (Kids Bop)', artist: 'Kids Bop Kids',
  },
  {
    id: 'r16',
    filename: 'smash_mouth_allstar_guitar_tab.mp3',
    size: '2.1 MB', type: 'Audio', speed: 'DSL', quality: 2,
    bitrate: '128 kbps', length: '2:12', seeds: 23,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'All Star (Guitar Cover)', artist: 'guitardude2003',
  },
  {
    id: 'r17',
    filename: 'blink182_whats_my_age_again.mp3',
    size: '2.9 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '128 kbps', length: '2:29', seeds: 310,
    isVirus: false, realFile: '/music/crazy_frog.mp3',
    title: "What's My Age Again?", artist: 'blink-182',
  },
  {
    id: 'r18',
    filename: 'nsynch_bye_bye_bye.mp3',
    size: '3.4 MB', type: 'Audio', speed: 'Cable', quality: 3,
    bitrate: '128 kbps', length: '3:35', seeds: 99,
    isVirus: false, realFile: '/music/american_pie.mp3',
    title: 'Bye Bye Bye', artist: 'NSYNC',
  },
  {
    id: 'r19',
    filename: 'limp_bizkit_rollin.mp3',
    size: '4.1 MB', type: 'Audio', speed: 'DSL', quality: 3,
    bitrate: '128 kbps', length: '4:18', seeds: 155,
    isVirus: false, realFile: '/music/blue_da_ba_dee.mp3',
    title: 'Rollin\'', artist: 'Limp Bizkit',
  },
  {
    id: 'r20',
    filename: 'daft_punk_harder_better_faster.mp3',
    size: '3.8 MB', type: 'Audio', speed: 'T1', quality: 5,
    bitrate: '128 kbps', length: '3:45', seeds: 427,
    isVirus: false, realFile: '/music/crazy_frog.mp3',
    title: 'Harder Better Faster Stronger', artist: 'Daft Punk',
  },
  {
    id: 'r21',
    filename: 'shrek_2_soundtrack_all_star_FULL.mp3',
    size: '3.5 MB', type: 'Audio', speed: 'Cable', quality: 4,
    bitrate: '128 kbps', length: '3:35', seeds: 512,
    isVirus: false, realFile: '/music/all_star.mp3',
    title: 'All Star (Shrek OST)', artist: 'Smash Mouth',
  },
  // ── Virus bait ───────────────────────────────────────────────
  {
    id: 'v1',
    filename: 'britney_spears_oops_i_did_it_again_LIVE.mp3',
    size: '3.2 MB', type: 'Audio', speed: 'DSL', quality: 3,
    bitrate: '128 kbps', length: '3:31', seeds: 44,
    isVirus: true, realFile: null,
  },
  {
    id: 'v2',
    filename: 'metallica_enter_sandman.mp3.exe',
    size: '1.1 MB', type: 'Program', speed: 'Modem', quality: 2,
    bitrate: '--', length: '--', seeds: 7,
    isVirus: true, realFile: null,
  },
  {
    id: 'v3',
    filename: 'windows_xp_activation_key_GENERATOR.exe',
    size: '456 KB', type: 'Program', speed: 'Cable', quality: 2,
    bitrate: '--', length: '--', seeds: 18,
    isVirus: true, realFile: null,
  },
  {
    id: 'v4',
    filename: 'limewire_pro_CRACKED_2005.exe',
    size: '2.3 MB', type: 'Program', speed: 'T1', quality: 3,
    bitrate: '--', length: '--', seeds: 63,
    isVirus: true, realFile: null,
  },
  {
    id: 'v5',
    filename: 'bonzi_buddy_installer_FREE.exe',
    size: '890 KB', type: 'Program', speed: 'DSL', quality: 4,
    bitrate: '--', length: '--', seeds: 201,
    isVirus: true, realFile: null,
  },
  {
    id: 'v6',
    filename: 'halo_2_full_game_NO_CD_CRACK.iso',
    size: '689 MB', type: 'Program', speed: 'T1', quality: 2,
    bitrate: '--', length: '--', seeds: 31,
    isVirus: true, realFile: null,
  },
  {
    id: 'v7',
    filename: 'britney_spears_NUDE_pics_REAL.jpg.exe',
    size: '78 KB', type: 'Program', speed: 'Modem', quality: 1,
    bitrate: '--', length: '--', seeds: 5,
    isVirus: true, realFile: null,
  },
  {
    id: 'v8',
    filename: 'harry_potter_goblet_of_fire_CAM_RIP.avi',
    size: '703 MB', type: 'Video', speed: 'Cable', quality: 2,
    bitrate: '--', length: '2:37:00', seeds: 12,
    isVirus: true, realFile: null,
  },
  {
    id: 'v9',
    filename: 'runescape_gold_generator_WORKING.exe',
    size: '234 KB', type: 'Program', speed: 'DSL', quality: 1,
    bitrate: '--', length: '--', seeds: 3,
    isVirus: true, realFile: null,
  },
  {
    id: 'v10',
    filename: 'free_itunes_SONGS_UNLOCKER.exe',
    size: '512 KB', type: 'Program', speed: 'Cable', quality: 2,
    bitrate: '--', length: '--', seeds: 9,
    isVirus: true, realFile: null,
  },
  {
    id: 'v11',
    filename: 'PS2_emulator_2005_NO_BIOS_NEEDED.exe',
    size: '1.7 MB', type: 'Program', speed: 'T1', quality: 3,
    bitrate: '--', length: '--', seeds: 88,
    isVirus: true, realFile: null,
  },
  {
    id: 'v12',
    filename: 'EARN_MONEY_FAST_2003.ppt.exe',
    size: '45 KB', type: 'Program', speed: 'Modem', quality: 1,
    bitrate: '--', length: '--', seeds: 2,
    isVirus: true, realFile: null,
  },
  {
    id: 'v13',
    filename: 'google_page_rank_CHEAT.zip.exe',
    size: '128 KB', type: 'Program', speed: 'DSL', quality: 1,
    bitrate: '--', length: '--', seeds: 4,
    isVirus: true, realFile: null,
  },
  {
    id: 'v14',
    filename: 'sims2_nude_patch_REAL.exe',
    size: '340 KB', type: 'Program', speed: 'Cable', quality: 2,
    bitrate: '--', length: '--', seeds: 17,
    isVirus: true, realFile: null,
  },
  {
    id: 'v15',
    filename: 'diablo2_LOD_serial_GENERATOR.exe',
    size: '67 KB', type: 'Program', speed: 'T1', quality: 2,
    bitrate: '--', length: '--', seeds: 11,
    isVirus: true, realFile: null,
  },
  {
    id: 'v16',
    filename: 'AIM_password_STEALER_2003.exe',
    size: '89 KB', type: 'Program', speed: 'Modem', quality: 1,
    bitrate: '--', length: '--', seeds: 6,
    isVirus: true, realFile: null,
  },
  {
    id: 'v17',
    filename: 'kazaa_lite_SPEED_HACK.exe',
    size: '445 KB', type: 'Program', speed: 'DSL', quality: 2,
    bitrate: '--', length: '--', seeds: 22,
    isVirus: true, realFile: null,
  },
  {
    id: 'v18',
    filename: 'counterstrike_aimbot_UNDETECTABLE.exe',
    size: '278 KB', type: 'Program', speed: 'T1', quality: 3,
    bitrate: '--', length: '--', seeds: 54,
    isVirus: true, realFile: null,
  },
  {
    id: 'v19',
    filename: 'microsoft_office_2003_CRACK.exe',
    size: '5.2 MB', type: 'Program', speed: 'Cable', quality: 3,
    bitrate: '--', length: '--', seeds: 44,
    isVirus: true, realFile: null,
  },
];

const FALLBACK_SUFFIXES = [
  '_FULL_HD_2003.mp3',
  '_ORIGINAL_VERSION.mp3',
  '_RADIO_EDIT_OFFICIAL.mp3',
  '_leak_unreleased.mp3',
  '_live_concert_bootleg.mp3',
];

export function searchResults(query: string, type: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  let pool = SEED_RESULTS;
  if (type !== 'All Types') {
    pool = pool.filter((r) => r.type === type);
  }

  const matches = pool.filter((r) => r.filename.toLowerCase().includes(q));
  if (matches.length >= 3) return matches;

  // Fallback: generate 5 results containing the search term.
  const legit = ['/music/all_star.mp3', '/music/blue_da_ba_dee.mp3', '/music/crazy_frog.mp3', '/music/american_pie.mp3'];
  const generated: SearchResult[] = FALLBACK_SUFFIXES.map((suf, i) => ({
    id: `gen_${q}_${i}`,
    filename: `${q.replace(/\s+/g, '_')}${suf}`,
    size: `${(2 + Math.random() * 3).toFixed(1)} MB`,
    type: 'Audio' as const,
    speed: (['T1', 'Cable', 'DSL', 'Modem'] as const)[i % 4],
    quality: ([3, 2, 4, 2, 3] as const)[i] as 1 | 2 | 3 | 4 | 5,
    bitrate: '128 kbps',
    length: `${2 + (i % 3)}:${String(10 + i * 7).padStart(2, '0')}`,
    seeds: Math.floor(5 + Math.random() * 80),
    isVirus: false,
    realFile: legit[i % legit.length],
    title: query.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    artist: 'Unknown Artist',
  }));

  return [...matches, ...generated];
}

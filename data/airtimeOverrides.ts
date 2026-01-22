/**
 * CineMontauge Owner-Provided Airtime Overrides
 * 
 * This is the source of truth for all manual airtime entries provided via chat.
 * Priorities: 1. Specific Episode Key (e.g. S27E10) | 2. Show Default Time
 */
export const AIRTIME_OVERRIDES: Record<number, { 
    provider: string; 
    time?: string;
    episodes?: Record<string, string>;
}> = {
    // Law & Order: Special Victims Unit (NBC)
    2734: { 
        provider: "NBC",
        episodes: {
            "S26E10": "9:00 pm ET / 6:00 pm PT",
            "S26E11": "9:00 pm ET / 6:00 pm PT",
            "S26E12": "9:00 pm ET / 6:00 pm PT",
            "S27E10": "9:00 pm ET / 6:00 pm PT",
            "S27E11": "9:00 pm ET / 6:00 pm PT",
            "S27E12": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // Grey's Anatomy (ABC)
    1416: { 
        provider: "ABC",
        episodes: {
            "S21E8": "10:00 pm ET / 7:00 pm PT",
            "S21E9": "10:00 pm ET / 7:00 pm PT",
            "S21E10": "10:00 pm ET / 7:00 pm PT",
            "S22E8": "10:00 pm ET / 7:00 pm PT",
            "S22E9": "10:00 pm ET / 7:00 pm PT",
            "S22E10": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // Law & Order (NBC)
    549: {
        provider: "NBC",
        episodes: {
            "S24E10": "8:00 pm ET / 5:00 pm PT",
            "S24E11": "8:00 pm ET / 5:00 pm PT",
            "S24E12": "8:00 pm ET / 5:00 pm PT",
            "S25E10": "8:00 pm ET / 5:00 pm PT",
            "S25E11": "8:00 pm ET / 5:00 pm PT",
            "S25E12": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Chicago Med (NBC)
    62650: {
        provider: "NBC",
        episodes: {
            "S10E10": "8:00 pm ET / 7:00 pm CT",
            "S10E11": "8:00 pm ET / 7:00 pm CT",
            "S11E10": "8:00 pm ET / 7:00 pm CT",
            "S11E11": "8:00 pm ET / 7:00 pm CT"
        }
    },
    // Murdoch Mysteries (CBC / BritBox)
    12786: {
        provider: "CBC / BritBox",
        episodes: {
            "S18E12": "8:00 pm ET / 5:00 pm PT",
            "S18E13": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Tell Me Lies (Hulu)
    130464: {
        provider: "Hulu",
        time: "12:00 am ET / 9:00 pm PT",
        episodes: {
            "S2E4": "12:00 am ET / 9:00 pm PT",
            "S2E5": "12:00 am ET / 9:00 pm PT"
        }
    },
    // Saturday Night Live (NBC)
    1667: {
        provider: "NBC / Peacock",
        episodes: {
            "S50E10": "11:29 pm ET / 8:29 pm PT",
            "S50E11": "11:29 pm ET / 8:29 pm PT",
            "S51E10": "11:29 pm ET / 8:29 pm PT",
            "S51E11": "11:29 pm ET / 8:29 pm PT"
        }
    },
    // The Pitt (HBO Max)
    250307: {
        provider: "HBO Max",
        episodes: {
            "S2E2": "9:00 pm ET / 6:00 pm PT",
            "S2E3": "9:00 pm ET / 6:00 pm PT",
            "S2E4": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // The Late Show with Stephen Colbert (CBS)
    63770: {
        provider: "CBS",
        episodes: {
            "S11E62": "11:35 pm ET / 10:35 pm CT",
            "S11E63": "11:35 pm ET / 10:35 pm CT",
            "S11E64": "11:35 pm ET / 10:35 pm CT"
        }
    },
    // Late Night with Seth Meyers (NBC)
    61818: {
        provider: "NBC / Peacock",
        episodes: {
            "S14E54": "12:35 am ET / 11:35 pm CT",
            "S14E55": "12:35 am ET / 9:35 pm PT",
            "S14E56": "12:35 am ET / 9:35 pm PT",
            "S14E57": "12:35 am ET / 9:35 pm PT",
            "S14E58": "12:35 am ET / 9:35 pm PT",
            "S14E59": "12:35 am ET / 9:35 pm PT",
            "S14E60": "12:35 am ET / 9:35 pm PT"
        }
    },
    // Pokémon Horizons (Netflix)
    220150: {
        provider: "Netflix",
        time: "3:00 am ET / 12:00 am PT",
        episodes: {
            "S1E124": "9:00 am ET / 6:00 am PT"
        }
    },
    // Primal (Adult Swim / Max)
    89456: {
        provider: "Adult Swim / Max",
        time: "12:00 am ET / 9:00 pm PT",
        episodes: {
            "S3E2": "12:00 am ET / 9:00 pm PT",
            "S3E3": "12:00 am ET / 9:00 pm PT"
        }
    },
    // The Daily Show (Comedy Central)
    2224: {
        provider: "Comedy Central / Paramount+",
        time: "11:00 pm ET / 8:00 pm PT",
        episodes: {
            "S31E9": "11:00 pm ET / 8:00 pm PT",
            "S31E10": "11:00 pm ET / 8:00 pm PT",
            "S31E11": "11:00 pm ET / 8:00 pm PT",
            "S31E12": "11:00 pm ET / 8:00 pm PT",
            "S31E13": "11:00 pm ET / 8:00 pm PT",
            "S31E14": "11:00 pm ET / 8:00 pm PT",
            "S31E15": "11:00 pm ET / 8:00 pm PT"
        }
    },
    // Chicago P.D. (NBC)
    58841: {
        provider: "NBC / Peacock",
        time: "10:00 pm ET / 7:00 pm PT",
        episodes: {
            "S12E10": "10:00 pm ET / 7:00 pm PT",
            "S12E11": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // Watch What Happens Live (Bravo)
    22: {
        provider: "Bravo / Peacock",
        time: "11:00 pm ET / 8:00 pm PT",
        episodes: {
            "S22E10": "11:00 pm ET / 8:00 pm PT",
            "S22E11": "11:00 pm ET / 8:00 pm PT",
            "S22E12": "11:00 pm ET / 8:00 pm PT",
            "S22E13": "11:00 pm ET / 8:00 pm PT",
            "S22E14": "11:00 pm ET / 8:00 pm PT",
            "S22E15": "11:00 pm ET / 8:00 pm PT",
            "S22E16": "11:00 pm ET / 8:00 pm PT"
        }
    },
    // 9-1-1 (FOX)
    75219: {
        provider: "FOX / Hulu",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S8E9": "8:00 pm ET / 5:00 pm PT",
            "S8E10": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // Tomorrow is Ours (TF1)
    72879: {
        provider: "TF1 / MyTF1",
        time: "6:00 pm ET / 3:00 pm PT",
        episodes: {
            "S9E100": "6:00 pm ET / 3:00 pm PT",
            "S9E101": "6:00 pm ET / 3:00 pm PT",
            "S9E102": "6:00 pm ET / 3:00 pm PT",
            "S9E103": "6:00 pm ET / 3:00 pm PT",
            "S9E104": "6:00 pm ET / 3:00 pm PT",
            "S9E105": "6:00 pm ET / 3:00 pm PT"
        }
    },
    // Dinastía Casillas (VIX)
    302463: {
        provider: "TelevisaUnivision / VIX",
        time: "7:00 pm ET / 4:00 pm PT",
        episodes: {
            "S1E68": "7:00 pm ET / 4:00 pm PT",
            "S1E69": "7:00 pm ET / 4:00 pm PT",
            "S1E70": "7:00 pm ET / 4:00 pm PT",
            "S1E71": "7:00 pm ET / 4:00 pm PT",
            "S1E72": "7:00 pm ET / 4:00 pm PT",
            "S1E73": "7:00 pm ET / 4:00 pm PT"
        }
    },
    // Men on a Mission (KBS)
    70672: {
        provider: "KBS / KBS World",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E514": "8:00 pm ET / 5:00 pm PT",
            "S1E515": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // The Night Manager (AMC)
    61859: {
        provider: "AMC / Streaming",
        time: "9:00 pm ET / 6:00 pm PT",
        episodes: {
            "S2E4": "9:00 pm ET / 6:00 pm PT",
            "S2E5": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // The Graham Norton Show (BBC)
    1220: {
        provider: "BBC One / BritBox",
        time: "10:00 pm ET / 7:00 pm PT",
        episodes: {
            "S32E14": "10:00 pm ET / 7:00 pm PT",
            "S32E15": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // Good Mythical Morning (YouTube)
    65701: {
        provider: "YouTube",
        time: "9:00 am ET / 6:00 am PT",
        episodes: {
            "S27E10": "9:00 am ET / 6:00 am PT",
            "S27E11": "9:00 am ET / 6:00 am PT",
            "S27E12": "9:00 am ET / 6:00 am PT",
            "S27E13": "9:00 am ET / 6:00 am PT",
            "S27E14": "9:00 am ET / 6:00 am PT",
            "S27E15": "9:00 am ET / 6:00 am PT"
        }
    },
    // Jeopardy! (Syndication)
    2912: {
        provider: "Syndication / Hulu",
        time: "7:00 pm ET / 4:00 pm PT",
        episodes: {
            "S42E95": "7:00 pm ET / 4:00 pm PT",
            "S42E96": "7:00 pm ET / 4:00 pm PT",
            "S42E97": "7:00 pm ET / 4:00 pm PT",
            "S42E98": "7:00 pm ET / 4:00 pm PT",
            "S42E99": "7:00 pm ET / 4:00 pm PT",
            "S42E100": "7:00 pm ET / 4:00 pm PT",
            "S42E101": "7:00 pm ET / 4:00 pm PT",
            "S42E102": "7:00 pm ET / 4:00 pm PT",
            "S42E103": "7:00 pm ET / 4:00 pm PT",
            "S42E104": "7:00 pm ET / 4:00 pm PT"
        }
    },
    // HITORI NO SHITA - THE OUTCAST (Crunchyroll)
    67063: {
        provider: "Crunchyroll",
        time: "12:00 am ET / 9:00 pm PT",
        episodes: {
            "S1E4": "12:00 am ET / 9:00 pm PT",
            "S1E5": "12:00 am ET / 9:00 pm PT"
        }
    },
    // SHRINKING (Apple TV+)
    136311: {
        provider: "Apple TV+",
        time: "9:00 pm ET / 6:00 pm PT",
        episodes: {
            "S1E1": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // IDOL I (Crunchyroll)
    285278: {
        provider: "Streaming / Crunchyroll",
        time: "12:00 am ET / 9:00 pm PT",
        episodes: {
            "S1E9": "12:00 am ET / 9:00 pm PT",
            "S1E10": "12:00 am ET / 9:00 pm PT",
            "S1E11": "12:00 am ET / 9:00 pm PT",
            "S1E12": "12:00 am ET / 9:00 pm PT"
        }
    },
    // WWE NXT (USA Network)
    31991: {
        provider: "USA Network / Peacock",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E3": "8:00 pm ET / 5:00 pm PT",
            "S1E4": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // ICI TOUT COMMENCE (TF1)
    112470: {
        provider: "TF1 / MyTF1",
        time: "6:00 pm ET / 3:00 pm PT",
        episodes: {
            "S1E100": "6:00 pm ET / 3:00 pm PT",
            "S1E101": "6:00 pm ET / 3:00 pm PT",
            "S1E102": "6:00 pm ET / 3:00 pm PT",
            "S1E103": "6:00 pm ET / 3:00 pm PT",
            "S1E104": "6:00 pm ET / 3:00 pm PT",
            "S1E105": "6:00 pm ET / 3:00 pm PT"
        }
    },
    // JIMMY KIMMEL LIVE! (ABC)
    1489: {
        provider: "ABC / Hulu",
        time: "11:35 pm ET / 8:35 pm PT",
        episodes: {
            "S1E61": "11:35 pm ET / 8:35 pm PT",
            "S1E62": "11:35 pm ET / 8:35 pm PT",
            "S1E63": "11:35 pm ET / 8:35 pm PT",
            "S1E64": "11:35 pm ET / 8:35 pm PT"
        }
    },
    // CHEF & MY FRIDGE (tvN)
    73036: {
        provider: "Streaming / tvN",
        time: "7:30 pm ET / 4:30 pm PT",
        episodes: {
            "S1E56": "7:30 pm ET / 4:30 pm PT",
            "S1E57": "7:30 pm ET / 4:30 pm PT"
        }
    },
    // THEATRE OF DARKNESS: YAMISHIBAI (Crunchyroll)
    56559: {
        provider: "Crunchyroll",
        time: "12:15 am ET / 9:15 pm PT",
        episodes: {
            "S1E2": "12:15 am ET / 9:15 pm PT",
            "S1E3": "12:15 am ET / 9:15 pm PT"
        }
    },
    // 20/20 (ABC)
    2035: {
        provider: "ABC / Hulu",
        time: "10:00 pm ET / 7:00 pm PT",
        episodes: {
            "S1E13": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // GRANTCHESTER (PBS)
    61457: {
        provider: "PBS / Streaming",
        time: "9:00 pm ET / 6:00 pm PT",
        episodes: {
            "S1E4": "9:00 pm ET / 6:00 pm PT",
            "S1E5": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // NO TAIL TO TELL (Crunchyroll)
    270420: {
        provider: "Streaming / Crunchyroll",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E1": "8:00 pm ET / 5:00 pm PT",
            "S1E2": "8:00 pm ET / 5:00 pm PT",
            "S1E3": "8:00 pm ET / 5:00 pm PT",
            "S1E4": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // CHRONICLES OF THE SUN (Crunchyroll)
    81329: {
        provider: "Crunchyroll",
        time: "12:00 am ET / 9:00 pm PT",
        episodes: {
            "S1E28": "12:00 am ET / 9:00 pm PT",
            "S1E29": "12:00 am ET / 9:00 pm PT",
            "S1E30": "12:00 am ET / 9:00 pm PT",
            "S1E31": "12:00 am ET / 9:00 pm PT",
            "S1E32": "12:00 am ET / 9:00 pm PT",
            "S1E33": "12:00 am ET / 9:00 pm PT"
        }
    },
    // THE MANAGER (KBS World)
    80736: {
        provider: "Streaming / KBS World",
        time: "7:00 pm ET / 4:00 pm PT",
        episodes: {
            "S1E381": "7:00 pm ET / 4:00 pm PT",
            "S1E382": "7:00 pm ET / 4:00 pm PT",
            "S1E383": "7:00 pm ET / 4:00 pm PT"
        }
    },
    // BEYBLADE X (Disney XD)
    226688: {
        provider: "Disney XD / Streaming",
        time: "8:00 am ET / 5:00 am PT",
        episodes: {
            "S1E112": "8:00 am ET / 5:00 am PT",
            "S1E113": "8:00 am ET / 5:00 am PT"
        }
    },
    // 2 DAYS AND 1 NIGHT (KBS2)
    30801: {
        provider: "KBS2 / Streaming",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E310": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // ABBOTT ELEMENTARY (ABC)
    125935: {
        provider: "ABC / Hulu",
        time: "9:30 pm ET / 6:30 pm PT",
        episodes: {
            "S4E11": "9:30 pm ET / 6:30 pm PT",
            "S4E12": "9:30 pm ET / 6:30 pm PT"
        }
    },
    // IMPRACTICAL JOKERS (TruTV)
    59186: {
        provider: "TruTV / Streaming",
        time: "10:00 pm ET / 7:00 pm PT",
        episodes: {
            "S11E11": "10:00 pm ET / 7:00 pm PT",
            "S11E12": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // WHEN CALLS THE HEART (Hallmark)
    61865: {
        provider: "Hallmark / Streaming",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S12E3": "8:00 pm ET / 5:00 pm PT",
            "S12E4": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // BEAT BOBBY FLAY (Food Network)
    62481: {
        provider: "Food Network / Streaming",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S37E2": "8:00 pm ET / 5:00 pm PT",
            "S37E3": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // CASUALTY (BBC One)
    1021: {
        provider: "BBC One / Streaming",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E2": "8:00 pm ET / 5:00 pm PT",
            "S1E3": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // THE HUNTING PARTY (AXN)
    247723: {
        provider: "Streaming / AXN",
        time: "9:00 pm ET / 6:00 pm PT",
        episodes: {
            "S1E3": "9:00 pm ET / 6:00 pm PT",
            "S1E4": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // MY HERO ACADEMIA: VIGILANTES (Crunchyroll)
    280110: {
        provider: "Crunchyroll",
        time: "12:00 am ET / 9:00 pm PT",
        episodes: {
            "S1E16": "12:00 am ET / 9:00 pm PT",
            "S1E17": "12:00 am ET / 9:00 pm PT"
        }
    },
    // TAMON'S B-SIDE (Crunchyroll)
    276393: {
        provider: "Streaming / Crunchyroll",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E3": "8:00 pm ET / 5:00 pm PT",
            "S1E4": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // ANUPAMAA (StarPlus)
    116479: {
        provider: "StarPlus / Streaming",
        time: "7:00 pm ET / 4:00 pm PT",
        episodes: {
            "S1E1899": "7:00 pm ET / 4:00 pm PT",
            "S1E1900": "7:00 pm ET / 4:00 pm PT",
            "S1E1901": "7:00 pm ET / 4:00 pm PT",
            "S1E1902": "7:00 pm ET / 4:00 pm PT",
            "S1E1903": "7:00 pm ET / 4:00 pm PT",
            "S1E1904": "7:00 pm ET / 4:00 pm PT",
            "S1E1905": "7:00 pm ET / 4:00 pm PT",
            "S1E1906": "7:00 pm ET / 4:00 pm PT",
            "S1E1907": "7:00 pm ET / 4:00 pm PT",
            "S1E1908": "7:00 pm ET / 4:00 pm PT"
        }
    },
    // ALL ELITE WRESTLING: DYNAMITE (TBS)
    91555: {
        provider: "TBS / Streaming",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E3": "8:00 pm ET / 5:00 pm PT",
            "S1E4": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // FATHER MATTEO (RAI)
    21220: {
        provider: "RAI / Streaming",
        time: "9:00 pm ET / 6:00 pm PT",
        episodes: {
            "S14E3": "9:00 pm ET / 6:00 pm PT",
            "S14E4": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // THE IMPERIAL CORONER (ITV)
    124595: {
        provider: "Streaming / ITV",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E6": "8:00 pm ET / 5:00 pm PT",
            "S1E7": "8:00 pm ET / 5:00 pm PT",
            "S1E8": "8:00 pm ET / 5:00 pm PT",
            "S1E9": "8:00 pm ET / 5:00 pm PT",
            "S1E10": "8:00 pm ET / 5:00 pm PT",
            "S1E11": "8:00 pm ET / 5:00 pm PT",
            "S1E12": "8:00 pm ET / 5:00 pm PT",
            "S1E13": "8:00 pm ET / 5:00 pm PT",
            "S1E14": "8:00 pm ET / 5:00 pm PT",
            "S1E15": "8:00 pm ET / 5:00 pm PT",
            "S1E16": "8:00 pm ET / 5:00 pm PT",
            "S1E17": "8:00 pm ET / 5:00 pm PT",
            "S1E18": "8:00 pm ET / 5:00 pm PT",
            "S1E19": "8:00 pm ET / 5:00 pm PT",
            "S1E20": "8:00 pm ET / 5:00 pm PT",
            "S1E21": "8:00 pm ET / 5:00 pm PT",
            "S1E22": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // SPIDEY AND HIS AMAZING FRIENDS (Disney Junior)
    127635: {
        provider: "Disney Junior / Streaming",
        time: "8:00 am ET / 5:00 am PT",
        episodes: {
            "S3E33": "8:00 am ET / 5:00 am PT",
            "S3E34": "8:00 am ET / 5:00 am PT",
            "S3E35": "8:00 am ET / 5:00 am PT",
            "S3E36": "8:00 am ET / 5:00 am PT"
        }
    },
    // UNDERCOVER MISS HONG (KBS World)
    293608: {
        provider: "Streaming / KBS World",
        time: "9:00 pm ET / 6:00 pm PT",
        episodes: {
            "S1E1": "9:00 pm ET / 6:00 pm PT",
            "S1E2": "9:00 pm ET / 6:00 pm PT",
            "S1E3": "9:00 pm ET / 6:00 pm PT",
            "S1E4": "9:00 pm ET / 6:00 pm PT"
        }
    },
    // TOJIMA WANTS TO BE A KAMEN RIDER (TV Asahi)
    285788: {
        provider: "Streaming / TV Asahi",
        time: "7:00 pm ET / 4:00 pm PT",
        episodes: {
            "S1E15": "7:00 pm ET / 4:00 pm PT",
            "S1E16": "7:00 pm ET / 4:00 pm PT"
        }
    },
    // DROPS OF GOD (Fuji TV)
    218961: {
        provider: "Fuji TV / Streaming",
        time: "10:00 pm ET / 7:00 pm PT",
        episodes: {
            "S1E1": "10:00 pm ET / 7:00 pm PT",
            "S1E2": "10:00 pm ET / 7:00 pm PT"
        }
    },
    // PAPÁS POR CONVENIENCIA (Telefe)
    247885: {
        provider: "Streaming / Telefe",
        time: "8:00 pm ET / 5:00 pm PT",
        episodes: {
            "S1E70": "8:00 pm ET / 5:00 pm PT",
            "S1E71": "8:00 pm ET / 5:00 pm PT",
            "S1E72": "8:00 pm ET / 5:00 pm PT",
            "S1E73": "8:00 pm ET / 5:00 pm PT",
            "S1E74": "8:00 pm ET / 5:00 pm PT",
            "S1E75": "8:00 pm ET / 5:00 pm PT",
            "S1E76": "8:00 pm ET / 5:00 pm PT",
            "S1E77": "8:00 pm ET / 5:00 pm PT",
            "S1E78": "8:00 pm ET / 5:00 pm PT",
            "S1E79": "8:00 pm ET / 5:00 pm PT"
        }
    },
    // HOW DO YOU PLAY? (KBS World)
    91121: {
        provider: "Streaming / KBS World",
        time: "7:00 pm ET / 4:00 pm PT",
        episodes: {
            "S1E313": "7:00 pm ET / 4:00 pm PT",
            "S1E314": "7:00 pm ET / 4:00 pm PT"
        }
    }
};
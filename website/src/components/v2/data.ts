// Real university coordinates — 120 major schools worldwide
export interface University {
  name: string;
  lat: number;
  lng: number;
  country: string;
  students: number;
}

export const universities: University[] = [
  // US — Big Ten / Power Five / Ivy / notable
  { name: "University of Michigan", lat: 42.278, lng: -83.738, country: "US", students: 47907 },
  { name: "Harvard University", lat: 42.377, lng: -71.117, country: "US", students: 21000 },
  { name: "MIT", lat: 42.360, lng: -71.094, country: "US", students: 11520 },
  { name: "Stanford University", lat: 37.428, lng: -122.170, country: "US", students: 17381 },
  { name: "Ohio State University", lat: 40.007, lng: -83.030, country: "US", students: 61369 },
  { name: "UCLA", lat: 34.069, lng: -118.445, country: "US", students: 45742 },
  { name: "USC", lat: 34.022, lng: -118.285, country: "US", students: 49500 },
  { name: "Yale University", lat: 41.316, lng: -72.922, country: "US", students: 14776 },
  { name: "Princeton University", lat: 40.343, lng: -74.651, country: "US", students: 8623 },
  { name: "Columbia University", lat: 40.808, lng: -73.962, country: "US", students: 33413 },
  { name: "University of Texas at Austin", lat: 30.285, lng: -97.734, country: "US", students: 51991 },
  { name: "Penn State", lat: 40.798, lng: -77.860, country: "US", students: 46810 },
  { name: "University of Wisconsin", lat: 43.076, lng: -89.412, country: "US", students: 47932 },
  { name: "University of Florida", lat: 29.643, lng: -82.355, country: "US", students: 55781 },
  { name: "Georgia Tech", lat: 33.776, lng: -84.399, country: "US", students: 44007 },
  { name: "Duke University", lat: 36.001, lng: -78.938, country: "US", students: 17620 },
  { name: "University of Virginia", lat: 38.033, lng: -78.508, country: "US", students: 26085 },
  { name: "Northwestern University", lat: 42.056, lng: -87.675, country: "US", students: 22459 },
  { name: "University of Chicago", lat: 41.789, lng: -87.600, country: "US", students: 17834 },
  { name: "Caltech", lat: 34.138, lng: -118.125, country: "US", students: 2397 },
  { name: "UC Berkeley", lat: 37.872, lng: -122.259, country: "US", students: 45307 },
  { name: "University of Washington", lat: 47.656, lng: -122.303, country: "US", students: 61468 },
  { name: "University of Illinois", lat: 40.102, lng: -88.227, country: "US", students: 56607 },
  { name: "University of North Carolina", lat: 35.905, lng: -79.047, country: "US", students: 31641 },
  { name: "Michigan State University", lat: 42.702, lng: -84.482, country: "US", students: 49695 },
  { name: "University of Oregon", lat: 44.045, lng: -123.073, country: "US", students: 23714 },
  { name: "Indiana University", lat: 39.168, lng: -86.523, country: "US", students: 47005 },
  { name: "Purdue University", lat: 40.424, lng: -86.921, country: "US", students: 49639 },
  { name: "University of Maryland", lat: 38.987, lng: -76.942, country: "US", students: 41200 },
  { name: "Rutgers University", lat: 40.500, lng: -74.447, country: "US", students: 50254 },
  { name: "Arizona State University", lat: 33.424, lng: -111.928, country: "US", students: 77881 },
  { name: "University of Colorado", lat: 40.008, lng: -105.266, country: "US", students: 40584 },
  { name: "University of Pittsburgh", lat: 40.444, lng: -79.953, country: "US", students: 34934 },
  { name: "Boston University", lat: 42.351, lng: -71.109, country: "US", students: 36714 },
  { name: "NYU", lat: 40.729, lng: -73.997, country: "US", students: 54880 },
  { name: "Georgetown University", lat: 38.907, lng: -77.072, country: "US", students: 20370 },
  { name: "Vanderbilt University", lat: 36.145, lng: -86.803, country: "US", students: 14422 },
  { name: "Rice University", lat: 29.717, lng: -95.402, country: "US", students: 8285 },
  { name: "University of Notre Dame", lat: 41.705, lng: -86.235, country: "US", students: 13139 },
  { name: "Gonzaga University", lat: 47.667, lng: -117.402, country: "US", students: 7572 },
  { name: "Clemson University", lat: 34.674, lng: -82.837, country: "US", students: 28466 },
  { name: "University of Alabama", lat: 33.210, lng: -87.546, country: "US", students: 38563 },
  { name: "LSU", lat: 30.413, lng: -91.180, country: "US", students: 35569 },
  { name: "Auburn University", lat: 32.603, lng: -85.488, country: "US", students: 33015 },
  { name: "University of Tennessee", lat: 35.955, lng: -83.929, country: "US", students: 34424 },
  { name: "University of Iowa", lat: 41.661, lng: -91.537, country: "US", students: 31240 },
  { name: "University of Minnesota", lat: 44.974, lng: -93.232, country: "US", students: 54953 },
  { name: "Oregon State University", lat: 44.563, lng: -123.282, country: "US", students: 33985 },
  { name: "University of Miami", lat: 25.718, lng: -80.279, country: "US", students: 19096 },
  { name: "Syracuse University", lat: 43.039, lng: -76.135, country: "US", students: 22850 },
  // D2/D3 small schools
  { name: "Williams College", lat: 42.713, lng: -73.203, country: "US", students: 2099 },
  { name: "Amherst College", lat: 42.370, lng: -72.517, country: "US", students: 1971 },
  { name: "Swarthmore College", lat: 39.902, lng: -75.357, country: "US", students: 1647 },
  { name: "Pomona College", lat: 34.098, lng: -117.713, country: "US", students: 1791 },
  { name: "Bowdoin College", lat: 43.907, lng: -69.964, country: "US", students: 1878 },
  // International — UK
  { name: "University of Oxford", lat: 51.758, lng: -1.254, country: "UK", students: 26445 },
  { name: "University of Cambridge", lat: 52.205, lng: 0.115, country: "UK", students: 24450 },
  { name: "Imperial College London", lat: 51.499, lng: -0.175, country: "UK", students: 22350 },
  { name: "UCL", lat: 51.525, lng: -0.134, country: "UK", students: 43840 },
  { name: "University of Edinburgh", lat: 55.944, lng: -3.189, country: "UK", students: 35375 },
  // Europe
  { name: "ETH Zürich", lat: 47.376, lng: 8.548, country: "CH", students: 24534 },
  { name: "Sorbonne University", lat: 48.849, lng: 2.357, country: "FR", students: 55600 },
  { name: "TU Munich", lat: 48.150, lng: 11.568, country: "DE", students: 50484 },
  { name: "University of Amsterdam", lat: 52.356, lng: 4.955, country: "NL", students: 39000 },
  { name: "KU Leuven", lat: 50.877, lng: 4.700, country: "BE", students: 60076 },
  { name: "University of Bologna", lat: 44.497, lng: 11.356, country: "IT", students: 87590 },
  { name: "Karolinska Institute", lat: 59.348, lng: 18.025, country: "SE", students: 8500 },
  { name: "University of Copenhagen", lat: 55.679, lng: 12.572, country: "DK", students: 38615 },
  { name: "University of Helsinki", lat: 60.169, lng: 24.950, country: "FI", students: 31000 },
  // Asia
  { name: "University of Tokyo", lat: 35.713, lng: 139.762, country: "JP", students: 28171 },
  { name: "Tsinghua University", lat: 40.000, lng: 116.326, country: "CN", students: 53302 },
  { name: "Peking University", lat: 39.993, lng: 116.310, country: "CN", students: 42136 },
  { name: "NUS", lat: 1.296, lng: 103.776, country: "SG", students: 43981 },
  { name: "Seoul National University", lat: 37.460, lng: 126.952, country: "KR", students: 28378 },
  { name: "IIT Bombay", lat: 19.132, lng: 72.916, country: "IN", students: 16000 },
  { name: "IIT Delhi", lat: 28.545, lng: 77.185, country: "IN", students: 13000 },
  { name: "University of Hong Kong", lat: 22.283, lng: 114.137, country: "HK", students: 31844 },
  { name: "Kyoto University", lat: 35.026, lng: 135.781, country: "JP", students: 22908 },
  { name: "KAIST", lat: 36.374, lng: 127.364, country: "KR", students: 10504 },
  { name: "Nanyang Technological University", lat: 1.347, lng: 103.681, country: "SG", students: 33500 },
  // Oceania
  { name: "University of Melbourne", lat: -37.798, lng: 144.960, country: "AU", students: 65000 },
  { name: "University of Sydney", lat: -33.889, lng: 151.189, country: "AU", students: 73000 },
  { name: "Australian National University", lat: -35.277, lng: 149.118, country: "AU", students: 25500 },
  { name: "University of Auckland", lat: -36.852, lng: 174.769, country: "NZ", students: 42759 },
  // Middle East / Africa
  { name: "Tel Aviv University", lat: 32.114, lng: 34.804, country: "IL", students: 30000 },
  { name: "KAUST", lat: 22.310, lng: 39.103, country: "SA", students: 1200 },
  { name: "University of Cape Town", lat: -33.958, lng: 18.461, country: "ZA", students: 29000 },
  { name: "American University in Cairo", lat: 30.020, lng: 31.500, country: "EG", students: 6500 },
  // Canada
  { name: "University of Toronto", lat: 43.663, lng: -79.396, country: "CA", students: 97000 },
  { name: "McGill University", lat: 45.505, lng: -73.577, country: "CA", students: 40036 },
  { name: "UBC", lat: 49.261, lng: -123.246, country: "CA", students: 72448 },
  // Latin America
  { name: "UNAM", lat: 19.332, lng: -99.187, country: "MX", students: 360000 },
  { name: "University of São Paulo", lat: -23.559, lng: -46.731, country: "BR", students: 97000 },
  { name: "University of Buenos Aires", lat: -34.600, lng: -58.373, country: "AR", students: 328000 },
  // More US to fill gaps
  { name: "Carnegie Mellon", lat: 40.443, lng: -79.944, country: "US", students: 15818 },
  { name: "Johns Hopkins", lat: 39.329, lng: -76.620, country: "US", students: 27092 },
  { name: "University of Southern California", lat: 34.022, lng: -118.285, country: "US", students: 49500 },
  { name: "Brown University", lat: 41.827, lng: -71.403, country: "US", students: 10696 },
  { name: "University of Pennsylvania", lat: 39.952, lng: -75.193, country: "US", students: 28264 },
  { name: "Cornell University", lat: 42.453, lng: -76.473, country: "US", students: 25582 },
  { name: "Dartmouth College", lat: 43.704, lng: -72.289, country: "US", students: 6638 },
  { name: "Emory University", lat: 33.791, lng: -84.324, country: "US", students: 15942 },
  { name: "Wake Forest University", lat: 36.134, lng: -80.277, country: "US", students: 8946 },
  { name: "University of Nebraska", lat: 40.820, lng: -96.700, country: "US", students: 25108 },
  { name: "Iowa State University", lat: 42.026, lng: -93.648, country: "US", students: 30708 },
  { name: "University of Kentucky", lat: 38.031, lng: -84.504, country: "US", students: 32710 },
  { name: "University of Kansas", lat: 38.954, lng: -95.253, country: "US", students: 27638 },
  { name: "West Virginia University", lat: 39.635, lng: -79.954, country: "US", students: 26839 },
  { name: "Baylor University", lat: 31.546, lng: -97.118, country: "US", students: 20824 },
  { name: "TCU", lat: 32.710, lng: -97.363, country: "US", students: 12379 },
  { name: "University of Houston", lat: 29.720, lng: -95.343, country: "US", students: 47100 },
  { name: "BYU", lat: 40.252, lng: -111.649, country: "US", students: 35602 },
  { name: "Boise State University", lat: 43.603, lng: -116.198, country: "US", students: 26152 },
  { name: "San Diego State University", lat: 32.775, lng: -117.071, country: "US", students: 36300 },
  { name: "University of Connecticut", lat: 41.807, lng: -72.254, country: "US", students: 32257 },
  { name: "Villanova University", lat: 40.038, lng: -75.340, country: "US", students: 10843 },
  { name: "Creighton University", lat: 41.266, lng: -95.946, country: "US", students: 8762 },
  { name: "Xavier University", lat: 39.150, lng: -84.473, country: "US", students: 7284 },
  { name: "Loyola Marymount", lat: 33.971, lng: -118.418, country: "US", students: 9749 },
];

// Event types
export type EventCategory = "academia" | "sports" | "students" | "trending";

export interface IntelEvent {
  id: string;
  category: EventCategory;
  university: University;
  headline: string;
  summary: string;
  severity: number; // 1-5, affects arc thickness
  timestamp: number;
  source?: string;
}

export const COLORS: Record<EventCategory, string> = {
  academia: "#3B82F6",
  sports: "#22C55E",
  students: "#A855F7",
  trending: "#F97316",
};

// Simulated event templates
const academiaEvents = [
  { headline: "Breakthrough in Quantum Error Correction", summary: "Research team achieves 99.9% fidelity in logical qubit operations, surpassing threshold for practical quantum computing.", severity: 5 },
  { headline: "New CRISPR Variant Targets Aging", summary: "Lab publishes Nature paper on gene-editing technique that reverses cellular aging in mammalian tissue by 40%.", severity: 4 },
  { headline: "$48M NSF Grant for Climate Modeling", summary: "National Science Foundation awards largest-ever climate research grant to interdisciplinary team.", severity: 4 },
  { headline: "AI Model Predicts Protein Folding in Real-Time", summary: "New neural architecture processes protein structures 1000x faster than AlphaFold, open-sourced immediately.", severity: 5 },
  { headline: "Dark Matter Signal Detected", summary: "Particle physics lab reports statistically significant anomaly consistent with WIMP-nucleon interactions.", severity: 5 },
  { headline: "Fusion Reactor Sustains Plasma for 8 Minutes", summary: "Engineering dept breaks previous record by 3x, bringing commercial fusion timeline forward.", severity: 4 },
  { headline: "New Antibiotic Class Discovered", summary: "Microbiology team isolates compound effective against all known drug-resistant bacteria strains.", severity: 5 },
  { headline: "Brain-Computer Interface Restores Speech", summary: "Neuroscience lab demonstrates real-time thought-to-speech for paralyzed patients with 95% accuracy.", severity: 4 },
  { headline: "Mathematics Proof Solves Open Problem", summary: "Mathematician posts proof of 30-year-old conjecture in algebraic topology. Peer review underway.", severity: 3 },
  { headline: "$12M DOE Grant for Battery Research", summary: "Chemistry department to develop solid-state lithium batteries with 2x energy density.", severity: 3 },
  { headline: "New Exoplanet Discovered in Habitable Zone", summary: "Astronomy team confirms rocky planet 12 light-years away with Earth-like atmosphere signatures.", severity: 4 },
  { headline: "Machine Learning Accelerates Drug Discovery", summary: "CS-Pharma collaboration identifies 3 promising cancer drug candidates in record 6 weeks.", severity: 3 },
  { headline: "Ocean Plastic Decomposition Method Published", summary: "Environmental engineering team develops enzyme that breaks down microplastics in seawater.", severity: 4 },
  { headline: "Quantum Internet Node Prototype Demonstrated", summary: "Physics lab achieves entanglement distribution over 50km fiber with error rates below 1%.", severity: 3 },
  { headline: "Ancient Language Decoded by AI", summary: "Linguistics and CS team uses transformer model to translate previously unreadable 3000-year-old script.", severity: 3 },
];

const sportsEvents = [
  { headline: "March Madness: #15 Seed Upsets #2", summary: "Historic upset sends shockwaves through brackets nationwide. First 15-2 upset since 2023.", severity: 5 },
  { headline: "D3 Lacrosse: Unranked Team Beats #1", summary: "Women's lacrosse squad pulls off miracle OT win. First loss for the top seed in 47 games.", severity: 4 },
  { headline: "College World Series Walk-Off Homer", summary: "Freshman hits 3-run walk-off in bottom of 9th to advance to championship series.", severity: 5 },
  { headline: "Track & Field: Collegiate 100m Record Broken", summary: "Sprinter clocks 9.82s, shattering 15-year-old NCAA record by 0.03 seconds.", severity: 5 },
  { headline: "Women's Soccer Wins National Title", summary: "Dominant 3-0 victory caps undefeated 24-0 season. Program's first championship.", severity: 4 },
  { headline: "Basketball: Triple OT Thriller", summary: "Conference rivals battle through 3 overtimes. Final score 112-109. Combined 40 three-pointers.", severity: 4 },
  { headline: "Swimming: Four Records Fall in Single Meet", summary: "Conference championship produces historic times in 200m fly, 100m back, 400m IM, and 4x100 relay.", severity: 3 },
  { headline: "Football: Hail Mary TD Wins Rivalry Game", summary: "72-yard touchdown pass as time expires stuns sold-out stadium of 107,000.", severity: 5 },
  { headline: "Wrestling: True Freshman Wins National Title", summary: "18-year-old becomes youngest NCAA wrestling champion in 30 years at 149 lbs.", severity: 3 },
  { headline: "Volleyball: 5-Set Comeback from 0-2 Down", summary: "Team rallies from two sets down to win conference semifinal. Libero records 42 digs.", severity: 3 },
  { headline: "NAIA Cross Country: Photo Finish", summary: "Two runners cross the line in identical 24:32.1 — officials review for 10 minutes.", severity: 3 },
  { headline: "Club Rugby: Underdog Wins Tournament", summary: "Club team with no scholarships beats 3 varsity programs to win regional championship.", severity: 3 },
  { headline: "Rowing: Program Sets Course Record", summary: "Varsity eight crew posts fastest time ever recorded on the 2000m course by 4 seconds.", severity: 3 },
  { headline: "Intramural Flag Football Goes Viral", summary: "Engineering students' trick play gets 2M views. ESPN picks up the highlight.", severity: 4 },
  { headline: "Hockey: OT Goal Sends Team to Frozen Four", summary: "Defenseman scores first career goal to clinch semifinal berth in front of home crowd.", severity: 4 },
];

const studentEvents = [
  { headline: "Student's Startup Raises $5M Seed Round", summary: "Junior's AI tutoring platform secures funding from Andreessen Horowitz while still in school.", severity: 4 },
  { headline: "Rhodes Scholar Announcement", summary: "Two students named Rhodes Scholars, will pursue graduate studies at Oxford next fall.", severity: 3 },
  { headline: "Student Film Accepted to Sundance", summary: "Senior's thesis film on immigrant experience selected for the Short Film Competition.", severity: 3 },
  { headline: "Undergrad Publishes in Nature", summary: "Sophomore biochemistry major is first author on groundbreaking cell biology paper.", severity: 4 },
  { headline: "Student-Built Satellite Launches to ISS", summary: "Engineering club's CubeSat successfully deployed from International Space Station.", severity: 4 },
  { headline: "Campus Food Pantry Serves 10,000th Student", summary: "Student-run initiative reaches milestone after 3 years of fighting food insecurity.", severity: 3 },
  { headline: "Student Government Passes Mental Health Bill", summary: "Resolution guarantees 10 free counseling sessions per semester. Administration agrees to fund.", severity: 3 },
  { headline: "Hackathon Winner Lands NASA Contract", summary: "Team of 4 undergrads wins space agency contract for their satellite debris tracking algorithm.", severity: 5 },
  { headline: "Student Orchestra Performs at Carnegie Hall", summary: "First university ensemble invited to perform in the main hall in over a decade.", severity: 3 },
  { headline: "Debate Team Wins World Championship", summary: "Pair of sophomores defeat Oxford in finals. First American winners since 2018.", severity: 4 },
  { headline: "Student Journalist Breaks Major Story", summary: "Campus newspaper investigation reveals misuse of research funds, picked up by NYT.", severity: 4 },
  { headline: "Graduate Student Discovers New Species", summary: "PhD candidate identifies New beetle species in campus nature preserve during routine fieldwork.", severity: 3 },
];

const trendingEvents = [
  { headline: "Viral TikTok: Professor's Surprise Pop Quiz Method", summary: "Physics prof's chaotic quiz format gets 8M views. Students rate it 'terrifying but effective.'", severity: 4 },
  { headline: "$200M Anonymous Donation Announced", summary: "Largest gift in university history to fund free tuition for families under $100K income.", severity: 5 },
  { headline: "Campus Squirrel Becomes Internet Sensation", summary: "Squirrel that attends lectures and sits in empty seats now has 500K Instagram followers.", severity: 3 },
  { headline: "University Announces Free Tuition Program", summary: "Board of trustees votes to eliminate tuition for all in-state students starting 2027.", severity: 5 },
  { headline: "AI Teaching Assistant Goes Viral", summary: "CS department's AI TA handles 10,000 student questions. Students can't tell it's not human.", severity: 4 },
  { headline: "Campus Power Outage Sparks Flash Mob", summary: "3,000 students create impromptu concert with phone flashlights. Video hits 5M views.", severity: 3 },
  { headline: "Historic Building Gets $50M Renovation", summary: "Alumnus funds complete restoration of 1892 library into state-of-the-art research center.", severity: 3 },
  { headline: "University President's Commencement Goes Viral", summary: "Speech about failure and resilience shared 2M times. Called 'best graduation speech ever.'", severity: 4 },
  { headline: "Student Petition Reaches 100K Signatures", summary: "Campaign for renewable energy commitment gains massive support. Board to vote next month.", severity: 3 },
  { headline: "Campus Becomes First Carbon-Neutral University", summary: "After 10-year initiative, all operations now run on 100% renewable energy.", severity: 4 },
];

const allTemplates: Record<EventCategory, typeof academiaEvents> = {
  academia: academiaEvents,
  sports: sportsEvents,
  students: studentEvents,
  trending: trendingEvents,
};

let eventCounter = 0;

export function generateEvent(): IntelEvent {
  const categories: EventCategory[] = ["academia", "sports", "students", "trending"];
  const weights = [0.3, 0.3, 0.2, 0.2]; // weighted distribution
  const rand = Math.random();
  let cumulative = 0;
  let category: EventCategory = "academia";
  for (let i = 0; i < categories.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) { category = categories[i]; break; }
  }

  const templates = allTemplates[category];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const uni = universities[Math.floor(Math.random() * universities.length)];

  return {
    id: `evt-${++eventCounter}-${Date.now()}`,
    category,
    university: uni,
    headline: template.headline,
    summary: template.summary,
    severity: template.severity,
    timestamp: Date.now(),
    source: uni.name,
  };
}

// Generate initial batch
export function generateInitialEvents(count: number): IntelEvent[] {
  const events: IntelEvent[] = [];
  for (let i = 0; i < count; i++) {
    const evt = generateEvent();
    evt.timestamp = Date.now() - Math.random() * 3600000; // spread over last hour
    events.push(evt);
  }
  return events.sort((a, b) => b.timestamp - a.timestamp);
}

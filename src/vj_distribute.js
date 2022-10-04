import Vjudge from "vjudge-api";
import fs from "fs";
import path from "path";

let OUTPUT_FILE = "DistributedList.txt";
let CONTEST_ID = 517287;
let TOP_SELECT = 15;
let MAX_PROBLEM_PER_PERSON = 2;
let IGNORED_IDS = [
  "Asad_Bin",
  "nahian00777",
  "adid_r10",
  "sakib_safwan",
  "Sojib_03",
  "Rashfi",
  "Ratnajit_Dhar",
  "shadmansaleh",
];

async function get_data(contest_id) {
  if (!fs.existsSync('cache')) fs.mkdirSync("cache");
  if (fs.existsSync(path.join('cache', `data-${contest_id}.json`))) {
    try {
      let data = await fs.promises.readFile(path.join('cache', `data-${contest_id}.json`));
      return JSON.parse(data);
    } catch (err) {
      throw err;
    }
  } else {
    let opts = {
      start: 0, // Start position from the problem-list, positive integer, default: 0
      length: 20, // Length of the output list, positive integer with maximum 20,  default: 20
      un: "", // Username of any user, default: '' (no specific user)
      res: 1, // Vjudge verdict expression, default: 0 (verdicts() function might help)
      num: "-", // Problem number in the contest (As A, B, C,...). Default: '-' (all problems)
      language: "", // Language of the submission, default: ''
      inContest: true, // Default: true
      contestId: contest_id, // Contest-id can be found in contest links, required.
    };
    let data = [];
    while (true) {
      process.stdout.write(
        `\rGet data: (${opts.start} - ${opts.start + opts.length})`
      );
      process.stdout.write('\r')
      try {
        let dat = await Vjudge.contest_status(opts);
        data = data.concat(dat.data);
        if (dat.data.length < 20) break;
        opts.start = opts.start + 20;
      } catch (err) {
        throw err;
      }
    }
    let json_str = JSON.stringify(data, null, 4);
    try {
      await fs.promises.writeFile(path.join('cache', `data-${contest_id}.json`), json_str);
    } catch (err) {
      throw err;
    }
    return data;
  }
}

// {
//     "memory": 2052,
//     "access": 2,
//     "statusType": 0,
//     "avatarUrl": "https://gravatar.loli.net/avatar/920f69745f1580ab98324729ac9310c7?d=robohash",
//     "runtime": 0,
//     "contestOpenness": 2,
//     "language": "C",
//     "userName": "Priyan_shu",
//     "userId": 685984,
//     "languageCanonical": "C",
//     "contestId": 517287,
//     "contestNum": "D",
//     "processing": false,
//     "runId": 38686765,
//     "time": 1664867809000,
//     "problemId": 448824,
//     "sourceLength": 140,
//     "status": "Accepted"
// },
function process_data(data) {
  try {
    let participentIdx = {};
    let participents = [];
    let problems = {};
    let first_submissioin = Date.now();

    data.forEach((submition) => {
      if (IGNORED_IDS.includes(submition.userName)) return;
      first_submissioin = Math.min(first_submissioin, submition.time);
    });

    data.forEach((submition) => {
      if (IGNORED_IDS.includes(submition.userName)) return;
      if (participentIdx[submition.userName] == undefined) {
        participentIdx[submition.userName] = participents.length;
        participents.push({
          name: submition.userName,
          penalty: 0,
          solved: new Set(),
        });
      }
      participents[participentIdx[submition.userName]].solved.add(
        submition.contestNum
      );
      participents[participentIdx[submition.userName]].penalty += Math.floor(
        (submition.time - first_submissioin) / 1000 / 60
      );
    });

    participents.sort((x, y) =>
      x.solved.size != y.solved.size
        ? y.solved.size - x.solved.size
        : x.penalty - y.penalty
    );
    participents = participents.slice(0, TOP_SELECT);
    participentIdx = {};
    for (let i = 0; i < TOP_SELECT; i++) {
      participentIdx[participents[i].name] = i;
    }

    data.forEach((submition) => {
      if (
        participentIdx[submition.userName] == undefined ||
        submition.contestNum == undefined
      )
        return;
      if (problems[submition.contestNum] == undefined) {
        problems[submition.contestNum] = {
          name: submition.contestNum,
          solved: new Set(),
        };
      }
      problems[submition.contestNum].solved.add(submition.userName);
    });
    let problemArr = [];
    for (const problem in problems) {
      problems[problem].solved = [...problems[problem].solved];
      problemArr.push(problems[problem]);
    }
    problemArr.sort((x, y) =>
      x.solved.size != y.solved.size
        ? x.solved.size - y.solved.size
        : x.name < y.name
          ? 0
          : 1
    );
    return { participents, problems: problemArr };
  } catch (err) {
    throw err;
  }
}

function getRand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distribute_problems(participents, problems) {
  let ret = {
    part_dist: {},
    prob_dist: [],
  };
  let done = [];
  participents.forEach((e) => {
    ret.part_dist[e.name] = [];
  });
  problems.forEach((e) => {
    e.solved = e.solved.filter((k) => !done.includes(k));
    // for (const k in done) {e.solved.delete(k);}
    if (e.solved.length > 0) {
      let name = getRand([...e.solved]);
      ret.part_dist[name].push(e.name);
      ret.prob_dist.push([e.name, name]);
      if (ret.part_dist[name].length == MAX_PROBLEM_PER_PERSON) {
        done.push(name);
      }
    } else {
      ret.prob_dist.push([e.name, undefined]);
    }
  });
  ret.prob_dist.sort((x, y) => {
    if (x[0].length == y[0].length) {
      if (x[0] < y[0]) return -1;
      else if (x[0] > y[0]) return 1;
      else return 0;
    } else if (x[0].length > y[0].length) return 1;
    else return -1;
  });
  return ret;
}

async function write(str) {
  try {
    await fs.promises.appendFile(OUTPUT_FILE, str + "\n");
    console.log(str);
  } catch (err) {
    throw err;
  }
}

async function main() {
  try {
    if (process.argv.length == 2) {
      console.log(`
vj_dist <ContestId> <OutputFile> <TopSelect> <MaxProblemPerPerson> <Ignored_Id> <IgnoredId>...

Distribute the solved problems of vjudge contest among top perticipants randomly

ContestId: Id of the contest (example: 517287)
OutputFile: file to write result to (Default: DistributedList.txt)
TopSelect: How many top participants should the problems be distributed to (default: 15)
MaxProblemPerPerson: How many problems can a perticipant get (default: 2)
IgnoredId: Usernames to ignore while operating
           (default: Asad_Bin, nahian00777, adid_r10, sakib_safwan, Sojib_03, Rashfi, Ratnajit_Dhar, shadmansaleh)
`);
      return;
    }
    CONTEST_ID = parseInt(process.argv[2]);
    if (process.argv.length > 3) OUTPUT_FILE = process.argv[3];
    if (process.argv.length > 4) TOP_SELECT = parseInt(process.argv[4]);
    if (process.argv.length > 5)
      MAX_PROBLEM_PER_PERSON = parseInt(process.argv[5]);
    for (let i = 6; i < process.argv.length; i++) {
      IGNORED_IDS.push(process.argv[i]);
    }
    let data = await get_data(CONTEST_ID);
    let { participents, problems } = process_data(data);
    let { part_dist, prob_dist } = distribute_problems(participents, problems);
    await fs.promises.writeFile(OUTPUT_FILE, "");
    let undistributed = []
    await write("Participent Distribution:");
    await write("-------------------------");
    for (const item of prob_dist) {
      if (item[1] == undefined) undistributed.push(item[0]);
      else await write(String(item[0]) + " : " + String(item[1]));
    }
    await write("\n")
    await write("Problem Distribution:");
    await write("---------------------");
    for (const item in part_dist) {
      await write(String(item) + " : " + String(part_dist[item]));
    }
    if (undistributed.length > 0) {
      await write("\n")
      await write("Undistributed: " + undistributed.join(", "));
    }
  } catch (err) {
    throw err;
  }
}

main().catch((err) => console.log(err));

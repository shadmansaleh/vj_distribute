### VJ_Distribute
Distribute the solved problems of vjudge contest among top perticipants randomly

### Setting Up

```sh
git clone --depth 1 https://github.com/shadmansaleh/vj_distribute
cd vj_distribute
npm install
```

### Uses
```
npm run vj_dist <ContestId> <OutputFile> <TopSelect> <MaxProblemPerPerson> <Ignored_Id> <IgnoredId>...

Distribute the solved problems of vjudge contest among top perticipants randomly

ContestId: Id of the contest (example: 517287)
OutputFile: file to write result to (Default: DistributedList.txt)
TopSelect: How many top participants should the problems be distributed to (default: 15)
MaxProblemPerPerson: How many problems can a perticipant get (default: 2)
IgnoredId: Usernames to ignore while operating
           (default: Asad_Bin, nahian00777, adid_r10, sakib_safwan, Sojib_03, Rashfi, Ratnajit_Dhar, shadmansaleh)
```

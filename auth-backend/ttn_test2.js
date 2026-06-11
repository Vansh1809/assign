const axios = require("axios");
const hosts = [
  "https://au1.cloud.thethings.network",
  "https://au1.cloud.thethingsindustries.com"
];
const key = "NNSXS.HAWZEFLPAUILL23EUM3XIGTQEPY6B57WT3DGTNQ.FKTNRVBISBJ6W66UQCJO4W6KIP3TVMVQM3BQ4ADZR724VC2IITIQ";
(async () => {
  for (const host of hosts) {
    console.log('HOST', host);
    for (const path of ["/api/v3","/api/v3/gateways","/api/v3/users/vansh440/gateways"]) {
      try {
        const resp = await axios.get(host + path, { headers: { Authorization: "Bearer " + key } });
        console.log(path, "STATUS", resp.status);
        console.log(JSON.stringify(resp.data).slice(0, 200));
      } catch (e) {
        if (e.response) console.error(path, "ERR", e.response.status, JSON.stringify(e.response.data).slice(0, 200));
        else console.error(path, "ERR", e.message);
      }
    }
  }
})();

export const ticketList = {data: [
  {id: "0", status: 2, date: new Date().valueOf(), lastEvent: new Date().valueOf(), subject: "tjatig unge"},
  {id: "1", status: 0, date: new Date(2024,9,30).valueOf(), lastEvent: new Date().valueOf(), subject: "spralligt o gapigt"},
  {id: "2", status: 3, date: new Date(2024,8,30).valueOf(), lastEvent: new Date(2024,9,30).valueOf(), subject: "en gång"}
]};

export function GetTicketDetails(id) {
  let find = ticketDetailList.find((element) => element.id == id)
  if (find == undefined)
    find = {id:"0", messages: []}
  return {data: find}
}

export const ticketDetailList = [
  {
    id: "0",
    messages: [
      {date: new Date(2024,10,9,14,30).valueOf(), message: "Min son slutar aldrig att tjata. What gives?", sender: "U"},
      { date: new Date(2024,10,9,14,30).valueOf(), message: "Har du provat napp?", sender: "A"}
    ]
  },
  {
    id: "1",
    messages: [
      {date: new Date(2024,9,30,15,0).valueOf(), message: "Min son är sprallig och gapig. What gives?", sender: "U"},
      {date: new Date(2024,10,1,14,0).valueOf(), message: "Har du provat att få honom att springa?", sender: "A"},
      {date: new Date(2024,10,9,13,30).valueOf(), message: "Lycka till med det... något förslag?", sender: "U"},
    ]
  },
  {
    id: "2",
    messages: [
      {date: new Date(2024,8,30,8,30).valueOf(), message: "Bara test en gång, funkar detta?", sender: "U"},
      {date: new Date(2024,9,30,16,30).valueOf(), message: "Japp", sender: "A"},
      {date: new Date(2024,9,30,16,30).valueOf(), message: "Ticket resolved", sender: "S"}
    ]
  },
];

export function pushStatus(data){
  ticketList.data.find((element) => element.id == data.id).status = data.status;
}

export function pushMessage(data){
  const ticket = ticketDetailList.find((element) => element.id == data.id)

  ticket.messages.push({
    date: new Date().valueOf(), message: data.message, sender: "U"
  });

  return {data: ticket}
}
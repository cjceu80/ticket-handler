using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using SocketIO.Serializer.NewtonsoftJson;
using SocketIOClient;
using SocketIOClient.Transport;
using SocketIOClient.Transport.Http;
using SocketIOClient.Transport.WebSockets;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Reflection.Metadata.Ecma335;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.Tab;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.TextBox;

namespace win_admin
{
    public partial class Form1 : Form
    {
        private static readonly HttpClient _client = new HttpClient();

        private static string _token = "";

        private static SocketIOClient.SocketIO? _socket;

        private static string _id = "";

        private static List<Details>? _details;

        private LoginForm? _loginForm = null;

        public string Id { get {  return _id; } }

        public List<HeaderData> _headers = new List<HeaderData>();

        public bool SocketConnected { get{ return _socket!.Connected; } }

        public event EventHandler HeaderDataRecived;

        protected virtual void OnHeaderDataRecived(EventArgs e)
        {
            HeaderDataRecived?.Invoke(this, e);
        }

        public delegate void HeaderDataRecivedEventHandler(object sender, EventArgs e);

        public void OnDataRecived(object? sender, EventArgs e)
        {
            RefreshHeaders();
        }

        public Form1()
        {
            InitializeComponent();
            HeaderDataRecived += OnDataRecived;
        }

        private void button1_Click(object sender, EventArgs e)
        {
           
        }

        public async Task Get_Token_Work()
        {
            var request = new HttpRequestMessage()
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri("http://localhost:4000/login"),
            };
            string test = JsonConvert.SerializeObject(new LoginCredentials(textBox1.Text, textBox2.Text));
            request.Content = new StringContent(test, Encoding.UTF8, "application/json");
            var response = await _client.SendAsync(request);
            JObject? des = (JObject?)(JsonConvert.DeserializeObject(await response.Content.ReadAsStringAsync()));
            if (response.IsSuccessStatusCode && des != null)
            _token = des.SelectToken("token")!.ToString();
          
        }

        public async Task Socket_Connect_Work()
        {
            SocketIOOptions socketIOOptions = new SocketIOOptions
            {
                ExtraHeaders = new Dictionary<string, string>
                {
                    ["authorization"] = string.Format("bearer {0}", _token)
                }

            };

            _socket = new SocketIOClient.SocketIO("http://localhost:4000/", socketIOOptions);

            _socket.OnConnected += async (sender, e) =>
            {

                await _socket.EmitAsync("whoami", request => _id = request.GetValue<string>());

            };

            _socket.Serializer = new NewtonsoftJsonSerializer(new JsonSerializerSettings
            {
                ContractResolver = new DefaultContractResolver
                {
                    NamingStrategy = new CamelCaseNamingStrategy()
                }
            });

            _socket.On("connect", request => { MessageBox.Show(request.ToString()); });

            await _socket.ConnectAsync();
        }

        public async Task Socket_Disconnect_Work() {
            await _socket!.DisconnectAsync();
            return;
        }

        public async Task Get_Headers_Work()
        {
            _headers = new List<HeaderData>();

            _socket!.EmitAsync("headers", response =>
            {
                var headersn = response.GetValue<JArray>();
                foreach (var header in headersn)
                    _headers.Add(header.ToObject<HeaderData>());

            }).GetAwaiter().GetResult();

            byte timeoutCounter = 0;
            while (_headers.Count == 0 && timeoutCounter < 10)
            {
                timeoutCounter++;
                await Task.Delay(20);
            }

            HeaderDataRecived?.Invoke(this, new EventArgs());
        }

        public async Task<string> Get_WhoAmI_Work()
        {
            _socket!.EmitAsync("whoami", response =>
            {
                _id = response.GetValue<string>();
                MessageBox.Show(response.ToString());

            }).GetAwaiter().GetResult();

            await Task.Delay(100);

            byte timeoutCounter = 0;
            while (_id == "" && timeoutCounter < 10)
            {
                timeoutCounter++;
                await Task.Delay(20);
            }

            return _id;
        }

        public async Task<Details> Get_Details_Work(string id)
        {
            Details detail = new Details();

            _socket.EmitAsync("details", response => MessageBox.Show(response.ToString()), id ).Wait();



            return detail;
        }

        private async void button2_Click(object sender, EventArgs e)
        {
            if (_socket == null) return;
            await _socket.ConnectAsync();

        }

        private void button3_Click(object sender, EventArgs e)
        {
            listBox1.Items.Add(_id);
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            _loginForm = new LoginForm(this);
            _loginForm.ShowDialog();
        }

        public void Log(string message)
        {
            listBox1.Items.Add(message);
        }

        public async void GetAllDetails(string[] ids)
        {
            Task[] getDetailTasks = new Task[ids.Length];
            for (int i = 0; i < ids.Length; i++)
            {
                string id = ids[i];
                getDetailTasks[i] = Get_Details_Work(id);
            }

            Task.WaitAll(getDetailTasks);

            
            foreach (Task<Details> task in getDetailTasks)
            {
                _details.Add(task.Result);
            }


        }

        public void RefreshHeaders()
        {
            foreach (HeaderData header in _headers)
            {
                //MessageBox.Show(header.admin);
                HeaderListViewItem listItem = new HeaderListViewItem(header);
                ticketsListView.Items.Add(listItem);
                
            }
        }
    }

    public  class LoginCredentials
    {
        public readonly string username;
        public readonly string password;   
        
        public LoginCredentials(string u, string pw)
        {
            username = u;
            password = pw;
        }
    }

    public struct HeaderData
    {
        public string _id = "";
        public int status;
        public DateTime date;
        public DateTime lastEven;
        public string subject = "";
        public string admin = "";

        public HeaderData()
        {
        }
    }

    public struct Details
    {
        public string _id = "";
        public Message[]? messages;

        public Details() { }
    }

    public struct Message
    {
        public DateTime date;
        public string message = "";
        public string sender = "";
        public string sender_name = "";

        public Message()
        {
        }
    }

    public struct HeadersDataPackage
    {
        List<HeaderData> headers;
    }
    
}

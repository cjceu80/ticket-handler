using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SocketIOClient;
using SocketIOClient.Transport;
using SocketIOClient.Transport.Http;
using SocketIOClient.Transport.WebSockets;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net.Sockets;
using System.Reflection.Metadata.Ecma335;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.Tab;

namespace win_admin
{
    public partial class Form1 : Form
    {
        private static readonly HttpClient client = new HttpClient();

        private static string token = "";

        private static SocketIOClient.SocketIO socket = new SocketIOClient.SocketIO("http://localhost:4000/");


        public Form1()
        {
            InitializeComponent();
            socket.On("*", response => {
                socket.EmitAsync("whoami", []);
                listBox1.Items.Add("yay"); 
            });
        }

        private async void button1_Click(object sender, EventArgs e)
        {
            var request = new HttpRequestMessage()
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri("http://localhost:4000/login"),
            };
            string test = JsonConvert.SerializeObject(new LoginCredentials(textBox1.Text, textBox2.Text));
            request.Content = new StringContent(test, Encoding.UTF8, "application/json");
            var response = await client.SendAsync(request);
            JObject des = (JObject)(JsonConvert.DeserializeObject(await response.Content.ReadAsStringAsync()));
            if (response.IsSuccessStatusCode && des != null)
                token = des.SelectToken("token").ToString();
                if (token != "")
                {
                    listBox1.Items.Add("token aquired successfully");
                }
            else
                listBox1.Items.Add("Failed to connect");


            SocketIOOptions socketIOOptions = new SocketIOOptions
            {
                ExtraHeaders = new Dictionary<string, string>
                {
                    ["authorization"] = string.Format("bearer {0}", token)
                }

            };

            socket = new SocketIOClient.SocketIO("http://localhost:4000/", socketIOOptions);

            

            listBox1.Items.Add(socket.Connected.ToString());
            await socket.ConnectAsync();
            listBox1.Items.Add(socket.Connected.ToString());
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

}

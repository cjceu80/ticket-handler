using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace win_admin
{

    public partial class LoginForm : Form
    {
        private readonly Form1? parent = null;

        public LoginForm(Form1 incParent)
        {
            InitializeComponent();
            parent = incParent;
        }

        private void LoginTextBox_TextChanged(object sender, EventArgs e)
        {
            if (userTextBox.Text.Length > 0 && passwordTextBox.Text.Length > 0)
                loginButton.Enabled = true;
            else loginButton.Enabled = false;
        }

        private async void LoginButton_Click(object sender, EventArgs e)
        {

            Task t = Task.Run(() => parent!.Get_Token_Work() );
            t.Wait();
            Task t2 = Task.Run(() => parent!.Socket_Connect_Work());
            t2.Wait();
            parent!.Log("Connected as " + parent.Id);

            parent!.Get_Headers_Work();
            
            Close();
        }

    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace win_admin
{
    internal class HeaderListViewItem : ListViewItem
    {
        public string _id;
        public int status;
        public DateTime date;
        public DateTime lastEven;
        public string subject;
        public string admin;

        public HeaderListViewItem(HeaderData header)
        {
            _id = header._id;
            status = header.status;
            date = header.date;
            lastEven = header.lastEven;
            subject = header.subject;
            admin = header.admin;

            Text = subject;

            ListViewSubItem tmp = new ListViewSubItem();
            tmp.Text = header.date.ToString();
            SubItems.Add(tmp);
        }
    
    }
}

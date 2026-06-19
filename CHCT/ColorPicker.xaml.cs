using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Diagnostics;

namespace CHCT
{
    /// <summary>
    /// ColorPicker.xaml 的互動邏輯
    /// </summary>
    public partial class ColorPicker : Window
    {
        public ColorPicker()
        {
            InitializeComponent();
            InitializeColorPlate();
            
        }

        private void InitializeColorPlate()
        {
            try
            {
                var c = new SolidColorBrush();
                for (int k = 0; k <= 256; k += 16)
                { 
                    for (int j = 0; j <= 256; j += 16)
                    {
                        for (int i = 0; i <= 256; i += 16)
                        {
                            if (k == 256) k = 255;
                            if (j == 256) j = 255;
                            if (i == 256) i = 255;
                            byte r = Convert.ToByte(k);
                            byte g = Convert.ToByte(j);
                            byte b = Convert.ToByte(i);
                            c = new SolidColorBrush(Color.FromArgb(255, r, g, b));
                            var btn = new Button()
                            {
                                Width = 18,
                                Height = 18,
                                Background = c
                            };
                            ColorPlate.Children.Add(btn);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Write(ex.Message);
            }
        }
    }
}

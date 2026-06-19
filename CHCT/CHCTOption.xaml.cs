using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Media;
using System.Windows.Controls.Primitives;
using System.Reflection;
using JEKExt.Type;
//using System.Windows.Media.Imaging;
//using System.Windows.Shapes;
//using System.Windows.Documents;
//using System.Windows.Input;
//using System.Text;
//using System.Threading.Tasks;
//using System.Data.Sql;
namespace CHCT
{
    /// <summary>
    /// CHCTOption.xaml 的互動邏輯
    /// </summary>
    public partial class CHCTOption : Window
    {
        Properties.Settings PSD = Properties.Settings.Default;
        CharDataSet CharDataSet;
        CharDataSetTableAdapters.PartCTableAdapter charDataSetPartCTableAdapter;
        CharDataSetTableAdapters.CharXTableAdapter charDataSetCharXTableAdapter;
        CharDataSetTableAdapters.PhoenicsTableAdapter charDataSetPhoenicsTableAdapter;
        CollectionViewSource partCViewSource;
        CollectionViewSource charXViewSource;
        CollectionViewSource phoenicsViewSource;
        public static class Globals
        {
            public static List<CharDataSet.PartCRow> l_res;
            // 控制項定義區
            public static ToggleButton[] btn_PTCustom;
            // 篩選定義區
            public static List<string> l_PTCustom;
            // 系統所有字體定義
            public static List<string> l_fonts;
            // 標音選擇暫存區
            public static List<string> l_phoenics;
        }
        public class PartCRow
        {
            public string P_char { get; set; }
            public short P_stkt { get; set; }
            public short P_fqc { get; set; }
        }

        private MainWindow parentForm;
        public CHCTOption(MainWindow prf)
        {
            InitializeComponent();
            parentForm = prf;
            Window_Loaded();
        }

        public void Window_Loaded()
        {
            CharDataSet = ((CharDataSet)(FindResource("charDataSet")));
            // 將資料載入資料表 PartC
            charDataSetPartCTableAdapter = new CharDataSetTableAdapters.PartCTableAdapter();
            charDataSetPartCTableAdapter.Fill(CharDataSet.PartC);
            partCViewSource = ((CollectionViewSource)(FindResource("partCViewSource")));
            partCViewSource.View.MoveCurrentToFirst();
            // 將資料載入資料表 CharX
            charDataSetCharXTableAdapter = new CharDataSetTableAdapters.CharXTableAdapter();
            charDataSetCharXTableAdapter.FillCHAR_STKT(CharDataSet.CharX);
            charXViewSource = ((CollectionViewSource)(FindResource("charXViewSource")));
            // 將資料載入資料表 Phoneics
            charDataSetPhoenicsTableAdapter = new CharDataSetTableAdapters.PhoenicsTableAdapter();
            charDataSetPhoenicsTableAdapter.Fill(CharDataSet.Phoenics);
            phoenicsViewSource = ((CollectionViewSource)(FindResource("phoenicsViewSource")));
            // 全域變數初始化
            InitializeGlobals();
            // 讀入自定義部件
            LoadPTCustom();
            // 讀入字體
            LoadFontStyle();
            // 讀入標音系統
            LoadPhoenicSystem();
            // 讀入使用者設定
            LoadUserSettings();
        }

        private void LoadUserSettings()
        {
            Properties.Settings PSD = Properties.Settings.Default;
            if (PSD.b_OutputAllPages) OutputAllPages.IsChecked = true; else OutputOnlyThePage.IsChecked = true;
        }

        public void InitializeGlobals()
        {
            Globals.l_res = new List<CharDataSet.PartCRow>();
            Globals.l_PTCustom = new List<string>();
            Globals.l_fonts = new List<string>();
        }
        private void LoadPTCustom()
        {
            PTCustomPanel.Children.Clear();

            var res = (from p in CharDataSet.PartC select p).ToList();
            int rCt = res.Count();
            ToggleButton[] btn_PTCustom = new ToggleButton[rCt + 1];
            for (int i = 1; i <= rCt; i++)
            {
                btn_PTCustom[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = FontSizeFilterCharBtnSlider.Value,
                    Height = FontSizeFilterCharBtnSlider.Value,
                    FontSize = FontSizeFilterCharBtnSlider.Value - 8,
                    //FontFamily = new FontFamily(ComboFilterBtnFont.SelectedItem.ToString()),
                    Content = res[i - 1].P_CHAR
                };
                btn_PTCustom[i].Click += new RoutedEventHandler(Btn_PTCustom_Click);
                PTCustomPanel.Children.Add(btn_PTCustom[i]);
            }
        }
        private void LoadFontStyle()
        {
            try
            {
                foreach (System.Drawing.FontFamily font in System.Drawing.FontFamily.Families) Globals.l_fonts.Add(font.Name);
                ComboCharBlockFont.ItemsSource = Globals.l_fonts;
                ComboFilterFont.ItemsSource = Globals.l_fonts;
                ComboRegularFont.ItemsSource = Globals.l_fonts;
                ComboFilterBtnFont.ItemsSource = Globals.l_fonts;
                ComboPartFont.ItemsSource = Globals.l_fonts;
                // 讀入使用者設定

                // 讀入字體
                ComboRegularFont.Text = PSD.s_ComboRegularFont;
                ComboCharBlockFont.Text = PSD.s_ComboCharBlockFont;
                ComboFilterFont.Text = PSD.s_ComboFilterFont;
                ComboFilterBtnFont.Text = PSD.s_ComboFilterBtnFont;
                ComboPartFont.Text = PSD.s_ComboPartFont;
                // 讀入標音
                PhoenicsPart1.Text = PSD.s_Phoenics1;
                PhoenicsPart2.Text = PSD.s_Phoenics2;
                PhoenicsPart3.Text = PSD.s_Phoenics3;
                // 讀入背景顏色
                List<string> bg = new List<string>() { PSD.s_PhoenicsBG1, PSD.s_PhoenicsBG2, PSD.s_PhoenicsBG3 };
                List<ComboBox> labelBG = new List<ComboBox>() { PhoenicsBGPart1, PhoenicsBGPart2, PhoenicsBGPart3 };
                List<Label> labelLB = new List<Label>() { PhoenicsLBPart1, PhoenicsLBPart2, PhoenicsLBPart3 };
                List<Brush> brush = new List<Brush>();
                foreach (string s in bg) brush.Add((Brush)typeof(Brushes).GetProperty(s).GetValue(null, null));
                for (int i = 0; i < 3; i++) labelBG[i].SelectedItem = bg[i];
                // 讀入字體大小
                FontSizeFilterTitleTB.Text = PSD.i_FontSizeFilterTitle.ToString();
                FontSizeFilterCharBtnTB.Text = PSD.i_FontSizeFilterCharBtn.ToString();
                FontSizeFilterClrBtnTB.Text = PSD.i_FontSizeFilterClrBtn.ToString();
            }
            catch (Exception ex)
            {
                Console.Write(ex.Message);
            }
        }
        private void LoadPhoenicSystem()
        {
            IEnumerable<string> brush = typeof(Brushes).GetProperties(BindingFlags.Static | BindingFlags.Public).Select(x => x.Name);
            ComboBox[] pCB = { PhoenicsPart1, PhoenicsPart2, PhoenicsPart3 };
            ComboBox[] pBG = { PhoenicsBGPart1, PhoenicsBGPart2, PhoenicsBGPart3 };

            foreach (ComboBox p in pCB) p.ItemsSource = MainWindow.Globals.a_PhSys;
            foreach (ComboBox p in pBG) p.ItemsSource = brush;
            // 寫入暫存
            for (int i = 0; i < 3; i++) pCB[i].Text = MainWindow.Globals.l_phoenics[i];
        }
        private void PhoenicsBGPart_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            string color = ((ComboBox)sender).SelectedItem.ToString();
            Brush brush = (Brush)typeof(Brushes).GetProperty(color).GetValue(null, null);
            Label[] pLB = { PhoenicsLBPart1, PhoenicsLBPart2, PhoenicsLBPart3 };
            pLB[Convert.ToInt16(((ComboBox)sender).Tag) - 1].Background = brush;

            foreach (TextBox tb in parentForm.PhoenicsPartialGrid1.Children) tb.Background = brush;
        }
        private void PhoenicsPart_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            try
            {
                Expander[] pFP = {parentForm.PhoenicsPartialExpander0,
                                  parentForm.PhoenicsPartialExpander1,
                                  parentForm.PhoenicsPartialExpander2,
                                  parentForm.PhoenicsPartialExpander3};
                ComboBox[] pCB = { PhoenicsPart1, PhoenicsPart2, PhoenicsPart3 };
                Grid[] pGr = {parentForm.PhoenicsPartialGrid0,
                              parentForm.PhoenicsPartialGrid1,
                              parentForm.PhoenicsPartialGrid2,
                              parentForm.PhoenicsPartialGrid3};
                var s = ((ComboBox)sender);
                int sTag = Convert.ToInt32(s.Tag);
                string sSI = s.SelectedItem.ToString();
                if (sSI == "無")
                {
                    if (sTag < 3)
                    {
                        pCB[sTag].Text = sSI;
                        pCB[sTag].IsEnabled = false;
                    }
                    pFP[sTag].Header = MainWindow.Globals.a_PhHeader[sTag];
                    pFP[sTag].IsExpanded = false;
                    pFP[sTag].Visibility = Visibility.Hidden;
                } else {
                    if (sTag < 3)
                    {
                        pCB[sTag].IsEnabled = true;
                    }
                    List<string> tbPG = SelectPhoenicsSystem(sSI);
                    int i = 0;
                    foreach (TextBox tb in pGr[sTag].Children)
                    {
                        tb.Text = tbPG[i]; i++;
                        tb.Visibility = (tb.Text == "") ? Visibility.Hidden : Visibility.Visible;
                    }
                    pFP[sTag].Header = s.SelectedItem.ToString();
                    pFP[sTag].IsExpanded = true;
                    pFP[sTag].Visibility = Visibility.Visible;
                }
                // 寫入暫存
                for (int i = 0; i < 3; i++) MainWindow.Globals.l_phoenics[i] = pCB[i].SelectedItem.ToString();
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        private List<string> SelectPhoenicsSystem(string systemName)
        {
            List<string> tbPG = new List<string>();
            List<string> finalPG = new List<string>();
            try
            {
                string pron = ""; string tbNp = "";
                var res = from p in CharDataSet.Phoenics select p;
                if (systemName == "威妥瑪拼音")
                {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.HYPY).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (systemName == "注音第二式") {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.WG).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (systemName == "耶魯拼音") {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.MPS2).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (systemName == "通用拼音") {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.YALE).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (systemName == "漢語拼音") {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.TY).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (systemName == "法國遠東學院拼音") {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.EFEO).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (systemName == "德國式拼音") {
                    foreach (TextBox tb in parentForm.PhoenicsPartialGrid0.Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.LOS).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
            return finalPG;
        }

        public bool IsPron(string pron)
        {
            return (pron == "ˇ" || pron == "ˋ" || pron == "ˊ" || pron == "˙") ? true : false;
        }

        private void Btn_PTCustom_Click(object sender, RoutedEventArgs e)
        {
            Globals.l_PTCustom.Clear();
            foreach (ToggleButton btn in PTCustomPanel.Children)
            {
                if (btn.IsChecked == true) { Globals.l_PTCustom.Add(Convert.ToString(btn.Content)); }
            }
        }

        private void PTCustomApply_Click(object sender, RoutedEventArgs e)
        {
            // 檢查是否為單一字元
            // 主查詢
            var nc = new PartCRow() { P_char = PTCustomInput.Text,
                P_stkt = Convert.ToInt16(PTCustomSTKT.Text),
                P_fqc = 0 };
            charDataSetPartCTableAdapter.Insert(nc.P_char, nc.P_stkt, nc.P_fqc);
            charDataSetPartCTableAdapter.Fill(CharDataSet.PartC);
            LoadPTCustom();
        }
        // 按下確定
        private void OK_Click(object sender, RoutedEventArgs e)
        {
            parentForm.UpdatePartCTableAdapter();
            parentForm.CreateSearchExpanderPTNormal();
            Close();
        }
        // 篩選區頁面
        // 標題大小調整
        private void FilterChrSizeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            try
            {
                parentForm.UpdateFilterChrSize(Convert.ToInt16(FontSizeFilterTitleSlider.Value));
            }
            catch (Exception ex)
            {
                Console.Write(ex.Message);
            }
        }
        // 字元按鈕大小
        private void FilterBtnSizeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            try
            {
                parentForm.UpdateFilterBtnChrSize(Convert.ToInt16(FontSizeFilterCharBtnSlider.Value));
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        // 清除按鈕大小
        private void FilterClrSizeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            try
            {
                parentForm.UpdateFilterClrChrSize(Convert.ToInt16(FontSizeFilterClrBtnSlider.Value));
            }
            catch (Exception ex)
            {
                Console.Write(ex.Message);
            }
        }
        // 字元區大小調整
        private void CharBlockBtnSizeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            try
            {
                parentForm.UpdateCharBlockChrSize(Convert.ToInt16(FontSizeCharBlockSlider.Value));
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        // 篩選區標題字型調整
        private void ComboFilterFont_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            parentForm.UpdateFilterChrFont(ComboFilterFont.SelectedItem.ToString());
        }
        // 篩選區按鈕字型調整
        private void ComboFilterBtnFont_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            parentForm.UpdateFilterBtnChrFont(ComboFilterBtnFont.SelectedItem.ToString());
        }
        // 字元區字型調整
        private void ComboCharBlockFont_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            parentForm.UpdateCharBlockChrFont(ComboCharBlockFont.SelectedItem.ToString());
        }
        // 字元拆分區字型調整
        private void ComboPartFont_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            parentForm.UpdateCharPartFont(ComboPartFont.SelectedItem.ToString());
        }

        private void PTCustomInput_TextChanged(object sender, TextChangedEventArgs e)
        {
            try
            {
                if (PTCustomInput.Text.Length > 0)
                {

                    var res = (from p in CharDataSet.CharX where p.C_CHAR.Contains(PTCustomInput.Text) select p.C_STKT).ToList();
                    PTCustomSTKT.Text = Convert.ToString(res[0]);
                    PTCustomApply.IsEnabled = true;
                } else {
                    PTCustomApply.IsEnabled = false;
                }
            } catch (Exception ex) {
                Console.Write(ex.Message);
                PTCustomApply.IsEnabled = false;
            }
        }
        private void PTCustomDelete_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                MessageBoxResult msg = MessageBox.Show("您確定要刪除所選擇的自定義部件嗎？", "確定刪除", MessageBoxButton.YesNo);
                if (msg == MessageBoxResult.Yes)
                {
                    var res = from p in CharDataSet.PartC select p;
                    Globals.l_res = res.Where(p => Globals.l_PTCustom.Contains(p.P_CHAR)).ToList();
                    for (int i = 0; i < Globals.l_res.Count; i++)
                    {
                        charDataSetPartCTableAdapter.Delete(Globals.l_res[i].P_ID,
                                                            Globals.l_res[i].P_CHAR,
                                                            Globals.l_res[i].P_STKT,
                                                            Globals.l_res[i].P_FQC);
                    }
                    charDataSetPartCTableAdapter.Fill(CharDataSet.PartC);
                    LoadPTCustom();
                }
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }


        }

        private void OptionPTCustomGridRegular_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.i_ptNormalstatus = Convert.ToInt16(MainWindow.Globals.PTNormalStatus.Regular);
        }
        private void OptionPTCustomGridAll_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.i_ptNormalstatus = Convert.ToInt16(MainWindow.Globals.PTNormalStatus.All);
        }

        private void Settings_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {

        }

        private void Apply_Click(object sender, RoutedEventArgs e)
        {
            // 儲存使用者設定
            Properties.Settings PSD = Properties.Settings.Default;
            // 一般設定-字體
            PSD.s_ComboRegularFont = ComboRegularFont.Text;
            PSD.s_ComboCharBlockFont = ComboCharBlockFont.Text;
            PSD.s_ComboFilterFont = ComboFilterFont.Text;
            PSD.s_ComboFilterBtnFont = ComboFilterBtnFont.Text;
            PSD.s_ComboPartFont = ComboPartFont.Text;
            // 一般設定-標音
            PSD.s_Phoenics1 = PhoenicsPart1.Text;
            PSD.s_Phoenics2 = PhoenicsPart2.Text;
            PSD.s_Phoenics3 = PhoenicsPart3.Text;
            // 一般設定-標音顏色
            PSD.s_PhoenicsBG1 = PhoenicsBGPart1.Text;
            PSD.s_PhoenicsBG2 = PhoenicsBGPart2.Text;
            PSD.s_PhoenicsBG3 = PhoenicsBGPart3.Text;

            // 輸出-輸出源範圍
            PSD.b_OutputAllPages = OutputAllPages.IsChecked.TrueBool();
            // 輸出-分隔符號
            PSD.b_OutputSeparate = OutputSeparateWith.IsChecked.TrueBool();
            PSD.s_OutputSeparate = OutputSeparateChar.Text;
            // 輸出-字型支援過濾

            // 其他-偵錯
            PSD.b_DebugMode = DebugModeEnabled.IsChecked.TrueBool();
            parentForm.TabItemDebug.Visibility = PSD.b_DebugMode ? Visibility.Visible : Visibility.Hidden;
        }

        // 使用 MainWindow Update 外部函式的眾多事件
        private void OutputOnlyThePage_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.b_OutputAllPages = false;
        }
        private void OutputAllPages_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.b_OutputAllPages = true;
        }
        private void OutputSeparateNone_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.b_OutputSeparate = false;
        }
        private void OutputSeparateWith_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.b_OutputSeparate = true;
            MainWindow.Globals.s_OutputSeparate = OutputSeparateChar.Text;
        }
        private void OutputSeparateChar_TextChanged(object sender, TextChangedEventArgs e)
        {
            MainWindow.Globals.b_OutputSeparate = true;
            MainWindow.Globals.s_OutputSeparate = OutputSeparateChar.Text;
        }
        private void OutputFontSupportedNone_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.b_OutputFontSupported = false;
        }
        private void OutputFontSupported_Checked(object sender, RoutedEventArgs e)
        {
            MainWindow.Globals.b_OutputFontSupported = true;
        }
        private void OutputFontSizeSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            try { parentForm.OutputTextBox.FontSize = OutputFontSizeSlider.Value; } catch { }
        }
        private void PTCustomModify_Click(object sender, RoutedEventArgs e)
        {

        }

        private void PTCustomCheck_Click(object sender, RoutedEventArgs e)
        {

        }
    }
}


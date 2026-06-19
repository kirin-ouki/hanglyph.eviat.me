using System;
using System.Windows;
using System.Windows.Data;
using System.Windows.Media;
using System.Windows.Markup;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Linq;
using System.Collections.Generic;
using System.Deployment.Application;
using System.Text;
//using System.Text.RegularExpressions;
using JEKExt.Type;
using JEKExt.UTFChar;
using System.Windows.Input;

namespace CHCT
{
    /// <summary>
    /// MainWindow.xaml 的互動邏輯
    /// 開發日誌與進度
    /// 
    /// 整體進度: 
    /// 
    /// 標音系統:       100%
    /// ├多重選擇功能:  100%
    /// └即時顯現與調整: 100%
    /// 
    /// 字元查詢系統: 100%
    /// ├基本查詢: 100%
    /// ├複合查詢: 100%
    /// ├清除功能: 100%
    /// └過濾功能: 100%
    /// 
    /// 版面: 83%
    /// ├主視窗: 90%
    /// └設定視窗: 60%
    /// 
    /// 輸出系統: 50%
    /// ├批量輸出: 70%
    /// └過濾輸出: 60%
    /// 
    /// </summary>
    /// 
    public partial class MainWindow : Window
    {
        // Dataset Public Declaration
        CharDataSet CharDataSet;
        CharDataSetTableAdapters.CharXTableAdapter charDataSetCharXTableAdapter;
        CharDataSetTableAdapters.PartBTableAdapter charDataSetPartBTableAdapter;
        CharDataSetTableAdapters.PartCTableAdapter charDataSetPartCTableAdapter;
        CharDataSetTableAdapters.PartKTableAdapter charDataSetPartKTableAdapter;
        CharDataSetTableAdapters.VersionTableAdapter charDataSetVersionTableAdapter;
        CharDataSetTableAdapters.PhoenicsTableAdapter charDataSetPhoenicsTableAdapter;
        // 統一charXViewSource
        CollectionViewSource charXViewSource;
        CollectionViewSource partBViewSource;
        CollectionViewSource partCViewSource;
        CollectionViewSource partKViewSource;
        CollectionViewSource versionViewSource;
        CollectionViewSource phoenicsViewSource;
        // Set of CharID
        int currentcharID;
        Properties.Settings PSD = Properties.Settings.Default;
        // 全域變數定義區
        public partial class Globals
        {

            public class ResChar
            {
                public List<CharDataSet.CharXRow> Res { get; set; }
                public List<bool> Res_fontAval { get; set; }
            }
            // 查詢定義區
            public static ResChar gres;
            public static List<CharDataSet.CharXRow> l_res;
            // 動態控制項定義區
            public static Button[]       btn_Char;
            public static ToggleButton[] btn_KX;
            public static ToggleButton[] btn_PTKXRDC;
            public static ToggleButton[] btn_PTNormal;
            public static ToggleButton[] btn_PTCustom;
            public static ToggleButton[] btn_STKT;
            public static ToggleButton[] btn_WX;
            public static ToggleButton[] btn_Zone;
            public static Button[]       btn_CharHistory;
            // 篩選定義區
            public static List<int>    l_KX;
            public static List<string> l_PTKXRDC;
            public static List<string> l_PTNormal;
            public static List<string> l_PTCustom;
            public static List<int>    l_STKT;
            public static List<short>  l_WX;
            public static List<int>    l_Freq;
            public static List<int>    l_Zone;
            public static List<string> l_CharHistory;
            // 狀態變數區
            public static int i_ptNormalstatus = 1;
            // 特別需求區
            public static string[] a_WX = { "", "金", "木", "水", "火", "土" };
            public static string[] a_Zone = { "U", "UA", "UB", "UC", "UD", "UE", "UF", "", "", "", "", "C", "CS" };
            public static string[] a_PhSys = { "無", "威妥瑪拼音", "注音第二式", "耶魯拼音", "通用拼音", "漢語拼音", "法國遠東學院拼音", "德國式拼音" };
            public static string[] a_PhHeader = { "注音", "其他標音1", "其他標音2", "其他標音3" };
            // 狀態表徵定義區
            public enum PTNormalStatus : int { Most = 0, Regular = 1, All = 2 }
            // 標音選擇暫存區
            public static List<string> l_phoenics;
            // 字元狀態暫存區
            public static List<string> btn_Char_info;
            // 選用功能開關區
            public static bool b_HighLightFontChar = Properties.Settings.Default.b_HighLightFontChar;
            public static bool b_OutputAllPages = Properties.Settings.Default.b_OutputAllPages;
            public static bool b_OutputSeparate = Properties.Settings.Default.b_OutputSeparate;
            public static string s_OutputSeparate = Properties.Settings.Default.s_OutputSeparate;
            public static bool b_OutputFontSupported = Properties.Settings.Default.b_OutputFontSupported;
            public static int i_SearchHistory = Properties.Settings.Default.i_SearchHistory;
            // 預設使用的所有選項
            public static FontFamily defaultFontA = new FontFamily(Properties.Settings.Default.s_FontDefaultA);
            public static FontFamily defaultFontB = new FontFamily(Properties.Settings.Default.s_FontDefaultB);

            
        }
        public class Brush
        {
            public static SolidColorBrush Button     = new SolidColorBrush(Color.FromArgb(0xFF, 0xDD, 0xDD, 0xDD));
            public static SolidColorBrush Eviat      = new SolidColorBrush(Color.FromArgb(0xFF, 0xCB, 0x25, 0x0D));
            public static SolidColorBrush Kiel       = new SolidColorBrush(Color.FromArgb(0xFF, 0xBE, 0xBE, 0xBE));
            public static SolidColorBrush Wolfrisger = new SolidColorBrush(Color.FromArgb(0xFF, 0x69, 0x5D, 0x63));
        }
        // 主核心：載入視窗
        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            CharDataSet = ((CharDataSet)(FindResource("charDataSet")));
            // 將資料載入資料表 CharX
            charDataSetCharXTableAdapter = new CharDataSetTableAdapters.CharXTableAdapter();
            charDataSetCharXTableAdapter.Fill(CharDataSet.CharX);
            charXViewSource = ((CollectionViewSource)(FindResource("charXViewSource")));
            charXViewSource.View.MoveCurrentToFirst();
            // 將資料載入資料表 PartB
            charDataSetPartBTableAdapter = new CharDataSetTableAdapters.PartBTableAdapter();
            charDataSetPartBTableAdapter.Fill(CharDataSet.PartB);
            partBViewSource = ((CollectionViewSource)(FindResource("partBViewSource")));
            // 將資料載入資料表 PartC
            charDataSetPartCTableAdapter = new CharDataSetTableAdapters.PartCTableAdapter();
            charDataSetPartCTableAdapter.Fill(CharDataSet.PartC);
            partCViewSource = ((CollectionViewSource)(FindResource("partCViewSource")));
            // 將資料載入資料表 PartK
            charDataSetPartKTableAdapter = new CharDataSetTableAdapters.PartKTableAdapter();
            charDataSetPartKTableAdapter.Fill(CharDataSet.PartK);
            partKViewSource = ((CollectionViewSource)(FindResource("partKViewSource")));
            charDataSetVersionTableAdapter = new CharDataSetTableAdapters.VersionTableAdapter();
            charDataSetVersionTableAdapter.Fill(CharDataSet.Version);
            // 將資料載入資料表 Phoneics
            charDataSetPhoenicsTableAdapter = new CharDataSetTableAdapters.PhoenicsTableAdapter();
            charDataSetPhoenicsTableAdapter.Fill(CharDataSet.Phoenics);
            phoenicsViewSource = ((CollectionViewSource)(FindResource("phoenicsViewSource")));
            // 寫入最大值
            C_IDTextBox_Count.Text = CharDataSet.CharX.Rows.Count.ToString();
            // 初始化所有介面
            InitializeGlobals();
            CreateSearchExpanderKXRDC();
            CreateSearchExpanderPT();
            CreateSearchExpanderSTKT();
            CreateSearchExpanderWX();
            CreateSearchExpanderZone();
            CreateCharBlock();
            CreateSearchHistory();
            // 新的字元區
            CreateCharBlocks();
        }

        // 主核心：關閉視窗
        private void Window_Closed(object sender, EventArgs e)
        {
            // 將目前的設定值全數寫入App.config
            Properties.Settings PSD = Properties.Settings.Default;
            PSD.b_HighLightFontChar   = Globals.b_HighLightFontChar;
            PSD.b_OutputAllPages      = Globals.b_OutputAllPages;
            PSD.b_OutputSeparate      = Globals.b_OutputSeparate;
            PSD.s_OutputSeparate      = Globals.s_OutputSeparate;
            PSD.b_OutputFontSupported = Globals.b_OutputFontSupported;
            PSD.s_FontDefaultA        = Globals.defaultFontA.Source.ToString();
            PSD.s_FontDefaultB        = Globals.defaultFontB.Source.ToString();
        }
        // 全域變數的初始化
        public void InitializeGlobals()
        {
            Globals.l_KX          = new List<int>();
            Globals.l_STKT        = new List<int>();
            Globals.l_PTKXRDC     = new List<string>();
            Globals.l_PTNormal    = new List<string>();
            Globals.l_PTCustom    = new List<string>();
            Globals.l_WX          = new List<short>();
            Globals.l_Zone        = new List<int>();
            Globals.l_CharHistory = new List<string>();
            Globals.btn_Char_info = new List<string>();
            Globals.gres          = new Globals.ResChar();

            Globals.l_phoenics = new List<string>() { PSD.s_Phoenics1, PSD.s_Phoenics2, PSD.s_Phoenics3 };
        }
        // 外部呼叫函式：更新自定義部件資料庫
        public void UpdatePartCTableAdapter()
        {
            charDataSetPartCTableAdapter.Fill(CharDataSet.PartC);
            CreateSearchExpanderPTCustom();
        }
        
        // 外部呼叫函式：更新篩選區按鈕字體大小
        public void UpdateFilterBtnChrSize(int val)
        {
            Expander[] EPGroup = { SearchExpanderKXRDC, SearchExpanderPT, SearchExpanderSTKT, SearchExpanderWX };
            WrapPanel[] SPGroup = { SearchPanelKXRDC, SearchPanelPTKXRDC, SearchPanelPTNormal,
                                    SearchPanelPTCustom, SearchPanelSTKT, SearchPanelWX, SearchPanelZone };
            foreach (Expander ep in EPGroup) ep.MaxHeight = val * 10;
            foreach (WrapPanel wp in SPGroup)
            {
                foreach (ToggleButton btn in wp.Children)
                {
                    btn.Width = val;
                    btn.Height = val;
                    btn.FontSize = val - 8;
                }
            }
        }
        // 外部呼叫函式：更新篩選區標題字體大小
        public void UpdateFilterChrSize(int val)
        {
            Expander[] EPGroup = { SearchExpanderKXRDC, SearchExpanderPT,   SearchExpanderSTKT,
                                   SearchExpanderWX,    SearchExpanderFreq, SearchExpanderZone };
            foreach (Expander ep in EPGroup) ep.FontSize = val;
            //foreach (Expander ep in SearchFilterGrid.Children) ep.FontSize = val;
            //foreach (Expander ep in SearchGridPT.Children) ep.FontSize = val;
        }
        // 外部呼叫函式：更新篩選區清除按鈕字體大小
        public void UpdateFilterClrChrSize(int val)
        {
            try
            {
                foreach (Button btn in SearchFilterGrid.Children)
                    btn.FontSize = val;
            }
            catch (Exception ex)
            {
                Console.Write(ex.Message);
            }
        }
        // 外部呼叫函式：更新字元區字體大小
        public void UpdateCharBlockChrSize(int val)
        {
            foreach (Button btn in CharBlockPanel.Children)
            {
                btn.Width = val;
                btn.Height = val;
                btn.FontSize = val - 8;
            }
            CharBlockGrid.Width = val * 8 + 10;
            CharBlockGrid.Height = val * 8 + 10;
            CharBlockActions.Width = val * 8 + 10;
            CharBlockSlider.Width = val * 8 - 132;
            FilterScroll.Margin = new Thickness(0, 0, val * 8 + 25, 0);
            CharBlockActions.Margin = new Thickness(0, val * 8 + 40, 10, 10);
        }
        
        // 外部呼叫函式：更新篩選區標題字型
        public void UpdateFilterChrFont(string font)
        {
            try { 
            FontFamily ff = new FontFamily(font);
            foreach (Expander ep in SearchFilterGrid.Children) ep.FontFamily = ff;
            foreach (Expander ep in SearchGridPT.Children) ep.FontFamily = ff;
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        // 外部呼叫函式：更新篩選區按鈕字型
        public void UpdateFilterBtnChrFont(string font)
        {
            try {
                FontFamily ff = new FontFamily(font);
                WrapPanel[] SPGroup = { SearchPanelKXRDC, SearchPanelPTKXRDC, SearchPanelPTNormal, SearchPanelSTKT, SearchPanelWX, SearchPanelZone };
                foreach (WrapPanel wp in SPGroup)
                    foreach (ToggleButton btn in wp.Children)
                        btn.FontFamily = ff;
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        // 外部呼叫函式：更新字元區字型
        public void UpdateCharBlockChrFont(string font)
        {
            try { 
                FontFamily ff = new FontFamily(font);
                C_CHARTextBox.FontFamily = ff;
                foreach (Button btn in CharBlockPanel.Children) btn.FontFamily = ff;
                foreach (Button btn in CharBlockPanel.Children) btn.Background = Brush.Button;
                // 輸出區域的字型也會跟著變
                OutputTextBox.FontFamily = ff;
                // 更新字元區塊
                int CBSVal = Convert.ToInt16(CharBlockSlider.Value);
                int tCA_UB = Globals.l_res.Count - (64 * CBSVal) < 64 ? (Globals.l_res.Count - 64 * CBSVal) : 64;
                CharBlockUpdated(CBSVal, tCA_UB);
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        // 外部呼叫函式：更新字元拆分區字型
        public void UpdateCharPartFont(string font)
        {
            try {
                FontFamily ff = new FontFamily(font);
                TrvMenu.FontFamily = ff;
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }
        
        // 外部呼叫函式：更新歷史查詢區
        public void UpdateSearchHistory()
        {
            // 將原先的字送到歷史查詢字裡
            Globals.l_CharHistory.Add(C_CHARTextBox.Text);
            // 處理歷史查詢字
            int count = Globals.l_CharHistory.Count();
            for (int i = count - 1; i >= 0; i--)
            {
                Globals.btn_CharHistory[count - i].Content = Globals.l_CharHistory[i];
                if (count - i >= Globals.i_SearchHistory) break;
            }
        }
        // 標準函式：確認各個字體是否支援某個字元
        private void PrintFamiliesSupportingChar(char characterToCheck)
        {
            int count = 0;
            ICollection<FontFamily> fontFamilies = Fonts.GetFontFamilies(@"C:\Windows\Fonts\");
            int unicodeValue = Convert.ToUInt16(characterToCheck);

            foreach (FontFamily family in fontFamilies)
            {
                var typefaces = family.GetTypefaces();
                foreach (Typeface typeface in typefaces)
                {
                    typeface.TryGetGlyphTypeface(out GlyphTypeface glyph);
                    if (glyph != null && glyph.CharacterToGlyphMap.TryGetValue(unicodeValue, out ushort glyphIndex))
                    {
                        family.FamilyNames.TryGetValue(XmlLanguage.GetLanguage("en-us"), out string familyName);
                        Console.WriteLine(familyName + " Supports ");
                        count++;
                        break;
                    }
                }
            }
            Console.WriteLine();
            Console.WriteLine("Total {0} fonts support {1}", count, characterToCheck);
            MessageBox.Show("Total " + count + " fonts support " + characterToCheck);
        }
        private List<bool> IfFontSupported(string font, List<CharDataSet.CharXRow> res)
        {
            List<bool> tmp = new List<bool>();
            try
            {
                FontFamily family = new FontFamily(font);
                foreach (CharDataSet.CharXRow cxr in res)
                {
                    var typefaces = family.GetTypefaces();
                    foreach (Typeface typeface in typefaces)
                    {
                        typeface.TryGetGlyphTypeface(out GlyphTypeface glyph);
                        if (glyph != null && glyph.CharacterToGlyphMap.TryGetValue(Convert.ToInt32(cxr.C_UDEC), out ushort glyphIndex))
                        {
                            family.FamilyNames.TryGetValue(XmlLanguage.GetLanguage("zh-tw"), out string familyName);
                            //Console.WriteLine(familyName + " Supports " + Convert.ToInt32(btn.Tag));
                            tmp.Add(true);
                            break;
                        } else {
                            tmp.Add(false);
                            break;
                        }
                    }
                }
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
            return tmp;
        }
        // 建立歷史查詢區的所有按鈕以及事件
        private void CreateSearchHistory()
        {
            Globals.btn_CharHistory = new Button[Globals.i_SearchHistory + 1];
            for (int i=1; i<=Globals.i_SearchHistory; i++)
            {
                Globals.btn_CharHistory[i] = new Button()
                {
                    Tag = i,
                    Width = 26,
                    Height = 26,
                    FontSize = 18,
                    FontFamily = new FontFamily(PSD.s_ComboCharBlockFont)
                };
                Globals.btn_CharHistory[i].Click += new RoutedEventHandler(Btn_CharHistory_Click);
                SearchHistoryWrapPanel.Children.Add(Globals.btn_CharHistory[i]);
            }
        }
        private void Btn_CharHistory_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var chr = (Button)sender;
                int tag = Convert.ToInt32(((Button)sender).Tag);
                var res = (from c in CharDataSet.CharX where c.C_CHAR == chr.Content.ToString() select c).ToList();
                currentcharID = res[0].C_ID;
                charXViewSource.View.MoveCurrentToPosition(currentcharID - 1);
            } catch (Exception ex) {
                Console.Write(ex);
            }
        }

        // 建立字元區的所有按鈕以及事件
        private void CreateCharBlock()
        {
            Globals.btn_Char = new Button[65];
            for (int i = 1; i <= 64; i++)
            {
                Globals.btn_Char[i] = new Button()
                {
                    Tag = i,
                    Width = 40,
                    Height = 40,
                    FontSize = 32,
                    FontFamily = new FontFamily(PSD.s_ComboCharBlockFont),
                    
                };
                Globals.btn_Char[i].Click += new RoutedEventHandler(Btn_Char_Click);
                Globals.btn_Char[i].MouseMove += new System.Windows.Input.MouseEventHandler(Btn_Char_MouseMove);
                CharBlockPanel.Children.Add(Globals.btn_Char[i]);
            }
        }

        private void Btn_Char_MouseMove(object sender, MouseEventArgs e)
        {
            Button b = (Button)sender;
            StatusText.Text = b.Tag.ToString();
        }

        private void Btn_Char_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                // 更新歷史查詢區
                UpdateSearchHistory();
                // 開始新查詢
                int tag = Convert.ToInt32(((Button)sender).Tag);
                var res = (from c in CharDataSet.CharX where c.C_UDEC == tag select c).ToList();
                currentcharID = res[0].C_ID;
                charXViewSource.View.MoveCurrentToPosition(currentcharID - 1);
            } catch (Exception ex) {
                Console.Write(ex);
            }
        }
        // 建立部首區的所有按鈕以及事件
        private void CreateSearchExpanderKXRDC()
        {
            Globals.btn_KX = new ToggleButton[215];
            for (int i = 1; i <= 214; i++)
            {
                Globals.btn_KX[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = 24,
                    Height = 24,
                    FontSize = 16,
                    FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                    Content = char.ConvertFromUtf32(i + 12031),
                    Background = Brushes.PaleGoldenrod
                };
                Globals.btn_KX[i].Click += new RoutedEventHandler(Btn_KX_Click);
                SearchPanelKXRDC.Children.Add(Globals.btn_KX[i]);
            }
        }
        private void Btn_KX_Click(object sender, RoutedEventArgs e)
        {
            Globals.l_KX.Clear();
            foreach (ToggleButton btn in SearchPanelKXRDC.Children)
            {
                if (btn.IsChecked == true)
                {
                    Globals.l_KX.Add(Convert.ToInt16(btn.Tag));
                }
            }
        }
        // 建立部件區的所有按鈕以及事件
        public void CreateSearchExpanderPT()
        {
            CreateSearchExpanderPTKXRDC();
            CreateSearchExpanderPTNormal();
            CreateSearchExpanderPTCustom();
        }
        public void CreateSearchExpanderPTKXRDC()
        {
            SearchPanelPTKXRDC.Children.Clear();
            var res = from p in CharDataSet.PartK select p.P_CHAR;
            int rCt = res.Count();
            ToggleButton[] btn_PT = new ToggleButton[rCt + 1];
            for (int i = 1; i <= rCt; i++)
            {
                btn_PT[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = 24,
                    Height = 24,
                    FontSize = 16,
                    FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                    Content = res.ElementAt(i - 1),
                    Background = Brushes.PaleGoldenrod
                };
                btn_PT[i].Click += new RoutedEventHandler(Btn_PTKXRDC_Click);
                SearchPanelPTKXRDC.Children.Add(btn_PT[i]);
            }
        }
        private void Btn_PTKXRDC_Click(object sender, RoutedEventArgs e)
        {
            //Globals.l_PT = new List<string>();
            Globals.l_PTKXRDC.Clear();
            foreach (ToggleButton btn in SearchPanelPTKXRDC.Children)
            {
                if (btn.IsChecked == true) { Globals.l_PTKXRDC.Add(Convert.ToString(btn.Content)); }
            }
        }
        public void CreateSearchExpanderPTNormal()
        {
            SearchPanelPTNormal.Children.Clear();
            var res = from p in CharDataSet.PartB where p.P_FQC <= Globals.i_ptNormalstatus select p.P_CHAR;
            int rCt = res.Count();
            ToggleButton[] btn_PT = new ToggleButton[rCt + 1];
            for (int i = 1; i <= rCt; i++)
            {
                btn_PT[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = 24,
                    Height = 24,
                    FontSize = 16,
                    FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                    Content = res.ElementAt(i - 1),
                    Background = Brushes.PaleGoldenrod
                };
                btn_PT[i].Click += new RoutedEventHandler(Btn_PTNormal_Click);
                SearchPanelPTNormal.Children.Add(btn_PT[i]);
            }
        }
        private void Btn_PTNormal_Click(object sender, RoutedEventArgs e)
        {
            //Globals.l_PT = new List<string>();
            Globals.l_PTNormal.Clear();
            foreach (ToggleButton btn in SearchPanelPTNormal.Children)
            {
                if (btn.IsChecked == true) { Globals.l_PTNormal.Add(Convert.ToString(btn.Content)); }
            }
        }
        public void CreateSearchExpanderPTCustom()
        {
            SearchPanelPTCustom.Children.Clear();
            var res = from p in CharDataSet.PartC select p.P_CHAR;
            int rCt = res.Count();
            ToggleButton[] btn_PT = new ToggleButton[rCt + 1];
            for (int i = 1; i <= rCt; i++)
            {
                btn_PT[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = 24,
                    Height = 24,
                    FontSize = 16,
                    FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                    Content = res.ElementAt(i - 1),
                    Background = Brushes.PaleGoldenrod
                };
                btn_PT[i].Click += new RoutedEventHandler(Btn_PTCustom_Click);
                SearchPanelPTCustom.Children.Add(btn_PT[i]);
            }
        }
        private void Btn_PTCustom_Click(object sender, RoutedEventArgs e)
        {
            Globals.l_PTCustom.Clear();
            foreach (ToggleButton btn in SearchPanelPTCustom.Children)
            {
                if (btn.IsChecked == true) { Globals.l_PTCustom.Add(Convert.ToString(btn.Content)); }
            }
        }
        // 建立筆畫區的所有按鈕以及事件
        private void CreateSearchExpanderSTKT()
        {
            Globals.btn_STKT = new ToggleButton[65];
            for (int i = 1; i <= 64; i++)
            {
                Globals.btn_STKT[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = 24,
                    Height = 24,
                    FontSize = 16,
                    FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                    Content = i,
                    Background = Brushes.PaleGoldenrod
                };
                Globals.btn_STKT[i].Click += new RoutedEventHandler(Btn_STKT_Click);
                SearchPanelSTKT.Children.Add(Globals.btn_STKT[i]);
            }
        }
        private void Btn_STKT_Click(object sender, RoutedEventArgs e)
        {
            //Globals.l_STKT = new List<int>();
            Globals.l_STKT.Clear();
            foreach (ToggleButton btn in SearchPanelSTKT.Children)
            {
                if (btn.IsChecked == true) { Globals.l_STKT.Add(Convert.ToInt16(btn.Content)); }
            }
        }
        // 建立五行區的所有按鈕以及事件
        private void CreateSearchExpanderWX()
        {
            Globals.btn_WX = new ToggleButton[6];
            for (int i = 1; i <= 5; i++)
            {
                Globals.btn_WX[i] = new ToggleButton()
                {
                    Tag = i,
                    Width = 24,
                    Height = 24,
                    FontSize = 16,
                    FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                    Content = Globals.a_WX[i],
                    Background = Brushes.PaleGoldenrod
                };
                Globals.btn_WX[i].Click += new RoutedEventHandler(Btn_WX_Click);
                SearchPanelWX.Children.Add(Globals.btn_WX[i]);
            }
        }
        private void Btn_WX_Click(object sender, RoutedEventArgs e)
        {
            //Globals.l_WX = new List<string>();
            Globals.l_WX.Clear();
            foreach (ToggleButton btn in SearchPanelWX.Children)
            {
                if (btn.IsChecked == true) { Globals.l_WX.Add(Convert.ToInt16(btn.Tag)); }
            }
            SearchExpanderPT.Content = "漢字部件篩選" + "";
        }
        // 建立字元Unicode區的所有按鈕以及事件
        private void CreateSearchExpanderZone()
        {
            var g = Globals.a_Zone.Count();
            Globals.btn_Zone = new ToggleButton[g];
            for (int i = 0; i <= g - 1; i++)
            {
                if (Globals.a_Zone[i] != "")
                {
                    Globals.btn_Zone[i] = new ToggleButton()
                    {
                        Tag = i,
                        Width = 24,
                        Height = 24,
                        FontSize = 16,
                        FontFamily = new FontFamily(PSD.s_ComboFilterBtnFont),
                        Content = Globals.a_Zone[i],
                        Background = Brushes.PaleGoldenrod
                    };
                    Globals.btn_Zone[i].Click += new RoutedEventHandler(Btn_Zone_Click);
                    SearchPanelZone.Children.Add(Globals.btn_Zone[i]);
                }
            }
        }
        private void Btn_Zone_Click(object sender, RoutedEventArgs e)
        {
            Globals.l_Zone.Clear();
            foreach (ToggleButton btn in SearchPanelZone.Children)
            {
                if (btn.IsChecked == true) { Globals.l_Zone.Add(Convert.ToInt16(btn.Tag)); }
            }

        }

        // 新的字元區生成
        private void CreateCharBlocks()
        {
            
            for (int i = 0; i < 8; i++)
            {
                RowDefinition rd = new RowDefinition() { Height = GridLength.Auto };
                ColumnDefinition cd = new ColumnDefinition() { Width = GridLength.Auto };
                GridCharBlocks.RowDefinitions.Add(rd);
                GridCharBlocks.ColumnDefinitions.Add(cd);
            }


            for (int i = 0; i < 8; i++)
                for (int j = 0; j < 8; j++)
                {
                    { 
                    Grid grid = new Grid();
                    ToggleButton btn = new ToggleButton() { Height = 64, Width = 64 };
                    grid.Children.Add(btn);
                    Grid.SetRow(grid, i);
                    Grid.SetColumn(grid, j);
                    GridCharBlocks.Children.Add(grid);
                    
                    }
                }
        }
        

        // 選單：按下選項
        private void Menu_Option_Click(object sender, RoutedEventArgs e)
        {
            CHCTOption opt = new CHCTOption(this);
            opt.Show();
        }
        // 選單：按下離開
        private void Menu_Exit_Click(object sender, RoutedEventArgs e)
        {
            Close();
        }
        // 選單：按下關於
        private void Menu_About_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                string ver = ApplicationDeployment.CurrentDeployment.CurrentVersion.ToString();
                string ver_Major = ApplicationDeployment.CurrentDeployment.CurrentVersion.Major.ToString();
                string ver_minor = ApplicationDeployment.CurrentDeployment.CurrentVersion.Minor.ToString();
                MessageBox.Show("製作者：J.E.K.\r目前版本：" + ver, "版本", MessageBoxButton.OK);
            }
            catch (Exception ex)
            {
                Console.Write(ex.Message);
                MessageBox.Show("未部屬/開發中版本。");
            }

            //Catch ex As InvalidDeploymentException

        }
        // 選單：醒目字型適用字被勾選
        private void Menu_HighLightFontChar_Checked(object sender, RoutedEventArgs e)
        {
            Globals.b_HighLightFontChar = true;
            // 更新字元區塊
            int CBSVal = Convert.ToInt16(CharBlockSlider.Value);
            int tCA_UB = Globals.l_res.Count - (64 * CBSVal) < 64 ? (Globals.l_res.Count - 64 * CBSVal) : 64;
            CharBlockUpdated(CBSVal, tCA_UB);
        }
        // 選單：醒目字型適用字被取消勾選
        private void Menu_HighLightFontChar_Unchecked(object sender, RoutedEventArgs e)
        {
            Globals.b_HighLightFontChar = false;
            // 清除字元區所有高亮
            ClearCharBlockPanelBackground();
        }
        // 按下查詢按鈕
        private void QueryExecute_Click(object sender, RoutedEventArgs e)
        {
            try {
                Globals.l_res = new List<CharDataSet.CharXRow>();
                var res = from p in CharDataSet.CharX select p;
                // 康熙部首
                if (Globals.l_KX.Count > 0) res = res.Where(p => Globals.l_KX.Contains(p.C_RDCN));
                // 總筆畫
                if (Globals.l_STKT.Count > 0) res = res.Where(p => Globals.l_STKT.Contains(p.C_STKT));
                // 五行
                if (Globals.l_WX.Count > 0) res = res.Where(p => Globals.l_WX.Contains(p.C_WX));
                // 康熙部首部件
                if (Globals.l_PTKXRDC.Count > 0) Globals.l_PTKXRDC.ForEach(p => res = res.Where(q => q.C_PTA.Contains(p)));
                // 一般部件
                if (Globals.l_PTNormal.Count > 0) Globals.l_PTNormal.ForEach(p => res = res.Where(q => q.C_PTA.Contains(p)));
                // 自定義部件
                if (Globals.l_PTCustom.Count > 0) Globals.l_PTCustom.ForEach(p => res = res.Where(q => q.C_PTA.Contains(p)));
                // 手動輸入的部件(有序)
                if (SearchPanelPTKeyIn.Text.Length > 0) res = res.Where(p => p.C_PTA.Contains(SearchPanelPTKeyIn.Text));
                // if (Globals.l_PT.Count > 0)   foreach (string str in Globals.l_PT) res = res.Where(p => p.C_PT.Contains(str));
                if (Convert.ToBoolean(RadBtnA.IsChecked)) res = res.Where(p => p.C_FQA >= Convert.ToInt16(TextBoxA.Text));
                if (Convert.ToBoolean(RadBtnT.IsChecked)) res = res.Where(p => p.C_FQT >= Convert.ToInt16(TextBoxT.Text));
                if (Convert.ToBoolean(RadBtnS.IsChecked)) res = res.Where(p => p.C_FQS >= Convert.ToInt16(TextBoxS.Text));
                // 字區
                if (Globals.l_Zone.Count > 0) res = res.Where(p => Globals.l_Zone.Contains(p.C_CZ));
                // 過濾筆畫為-1者(即目前未建構資料者)
                res = res.Where(p => p.C_STKT > -1);
                // 取得字元 List
                Globals.l_res = res.OrderBy(p => p.C_STKT).ToList();
                Globals.gres.Res = res.OrderBy(p => p.C_STKT).ToList();
                Globals.gres.Res_fontAval = IfFontSupported(Globals.btn_Char[1].FontFamily.Source, Globals.l_res);

                // 將所得到的字元放置進字元區塊中
                int rCt = Globals.gres.Res.Count;
                int tCAPage = (rCt - 1) / 64;
                int tCAUBound = (tCAPage + 1) * 64;
                CharBlockSlider.Maximum = tCAPage;
                CharBlockSlider.Value = 0;
                // 更新字元區塊
                int sliderValue = 0;
                int tBlockUBound = (rCt < 64 ? rCt : 64);
                CharBlockUpdated(sliderValue, tBlockUBound);
            }
            catch (Exception ex)
            {
                ErrText.Text = ex.Message;
            }
        }
        // 簡單函式：清除字元區所有高亮背景
        private void ClearCharBlockPanelBackground()
        {
            foreach (Button btn in CharBlockPanel.Children) btn.Background = Brush.Button;
        }
        // 拉動字元區橫條時的事件
        private void CharBlockSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            int CBSVal = Convert.ToInt16(CharBlockSlider.Value);
            int tCA_UB = Globals.l_res.Count - (64 * CBSVal) < 64 ? (Globals.l_res.Count - 64 * CBSVal) : 64;
            CharBlockUpdated(CBSVal, tCA_UB);
        }
        // 字元區更新
        private void CharBlockUpdated(int sliderValue, int tBlockUBound)
        {
            try
            {
                Globals.gres.Res_fontAval = IfFontSupported(Globals.btn_Char[1].FontFamily.Source, Globals.gres.Res);
                foreach (Button btn in CharBlockPanel.Children) btn.Content = "";

                for (int i = 1; i <= 64; i++)
                {
                    if (i <= tBlockUBound)
                    {
                        Globals.btn_Char[i].Content = Globals.gres.Res[64 * sliderValue + i - 1].C_CHAR;
                        Globals.btn_Char[i].Tag = Globals.gres.Res[64 * sliderValue + i - 1].C_UDEC;
                        Globals.btn_Char[i].Background = (Globals.gres.Res_fontAval[64 * sliderValue + i - 1]) ? Brushes.Gold : Brush.Button;
                    } else {
                        Globals.btn_Char[i].Content = "";
                        Globals.btn_Char[i].Tag = 0;
                        Globals.btn_Char[i].Background = Brush.Button;
                    }
                }
                // 刷新錯誤訊息
                ErrText.Text = "錯誤：無";
            } catch (Exception ex) {
                ErrText.Text = ex.Message;
            }
        }
        // 六個資料庫簡單移動事件：初、快前、前、後、快後、終
        private void MoveFirst_Click(object sender, RoutedEventArgs e)
        {
            charXViewSource.View.MoveCurrentToFirst();
            currentcharID = charXViewSource.View.CurrentPosition + 1;
            MoveMessageUpdate(sender, e);
        }
        private void MovePreviousLarge_Click(object sender, RoutedEventArgs e)
        {
            currentcharID = currentcharID > 100 ? currentcharID - 100 : 1;
            charXViewSource.View.MoveCurrentToPosition(currentcharID - 1);
            MoveMessageUpdate(sender, e);
        }
        private void MovePrevious_Click(object sender, RoutedEventArgs e)
        {
            charXViewSource.View.MoveCurrentToPrevious();
            currentcharID = charXViewSource.View.CurrentPosition + 1;
            MoveMessageUpdate(sender, e);
        }
        private void MoveNext_Click(object sender, RoutedEventArgs e)
        {
            charXViewSource.View.MoveCurrentToNext();
            currentcharID = charXViewSource.View.CurrentPosition + 1;
            MoveMessageUpdate(sender, e);
        }
        private void MoveNextLarge_Click(object sender, RoutedEventArgs e)
        {
            int Max = Int32.Parse(C_IDTextBox_Count.Text);
            currentcharID = currentcharID < Max - 100 ? currentcharID + 100 : Max;
            charXViewSource.View.MoveCurrentToPosition(currentcharID - 1);
            MoveMessageUpdate(sender, e);
        }
        private void MoveLast_Click(object sender, RoutedEventArgs e)
        {
            charXViewSource.View.MoveCurrentToLast();
            currentcharID = charXViewSource.View.CurrentPosition + 1;
            MoveMessageUpdate(sender, e);
        }
        // 資料庫簡單移動事件的訊息更新
        private void MoveMessageUpdate(object sender, RoutedEventArgs e)
        {
            Button b = (Button)sender;
            StatusText.Text = "最後動作：按下" + b.Content;
            ErrText.Text = "錯誤：無";
            // 處理自選標音部分
            Expander[] pFP = { PhoenicsPartialExpander1, PhoenicsPartialExpander2, PhoenicsPartialExpander3 };
            Grid[] pGr = { PhoenicsPartialGrid0, PhoenicsPartialGrid1, PhoenicsPartialGrid2, PhoenicsPartialGrid3 };
            List<string> tbPG = new List<string>();
            List<string> finalPG = new List<string>();
            string pron = ""; string tbNp = "";
            var res = from p in CharDataSet.Phoenics select p;
            int j = 1;
            foreach (Expander ep in pFP)
            {

                if (ep.Visibility == Visibility.Hidden) break;
                // 查詢標音
                if (ep.Header.ToString() == "威妥瑪拼音")
                {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.WG).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                } else if (ep.Header.ToString() == "注音第二式") {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.WG).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
                else if (ep.Header.ToString() == "耶魯拼音") {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.MPS2).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
                else if (ep.Header.ToString() == "通用拼音") {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.YALE).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
                else if (ep.Header.ToString() == "漢語拼音") {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.TY).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
                else if (ep.Header.ToString() == "法國遠東學院拼音") {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.EFEO).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
                else if (ep.Header.ToString() == "德國式拼音") {
                    foreach (TextBox tb in pGr[0].Children)
                    {
                        pron = tb.Text.Substring(tb.Text.Length - 1);
                        tbNp = IsPron(pron) ? tb.Text.Substring(0, tb.Text.Length - 1) : tb.Text;
                        pron = IsPron(pron) ? pron : "";
                        tbPG = (res.Where(p => p.MPS1 == tbNp).Select(q => q.LOS).ToList());
                        if (tbPG.Count == 0) finalPG.Add(""); else finalPG.Add(tbPG[0] + pron);
                    }
                }
                // 寫入標音
                int i = 0;
                foreach (TextBox tb in pGr[j].Children)
                {
                    tb.Text = finalPG[i]; i++;
                    tb.Visibility = (tb.Text == "") ? Visibility.Hidden : Visibility.Visible;
                } j++;

            }
        }
        public bool IsPron(string pron)
        {
            return (pron == "ˇ" || pron == "ˋ" || pron == "ˊ" || pron == "˙") ? true : false;
        }
        // 字元資料庫ID移動事件
        private void CharSlider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            try
            {
                currentcharID = Convert.ToInt32(CharSlider.Value);
                charXViewSource.View.MoveCurrentToPosition(currentcharID - 1);
            } catch (Exception ex) {
                Console.Write(ex);
            }
        }
        // 更新 UHEX/RDC/CZ 
        private void C_UDECTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            try {
                int i_DEC = Convert.ToInt32(C_UDECTextBox.Text);
                C_UHEXTextBox.Text = i_DEC.ToString("X");
                C_CZTextBox.Text = C_CZCheck(i_DEC);
                C_RDCNTextBox_RDC.Text = char.ConvertFromUtf32(Convert.ToInt16(C_RDCNTextBox.Text) + 12031);
            } catch (Exception ex) {
                Console.Write(ex);
            }
        }
        // 更新 WX 
        private void C_WXTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            try {
                int i_WX = Convert.ToInt16(C_WXTextBox.Text);
                C_WXTextBox_WX.Text = (i_WX != -1) ? Globals.a_WX[i_WX] : "";
            } catch (Exception ex) {
                Console.Write(ex);
            }
        }
        // 字元所在大區的檢測
        private string C_CZCheck(int charDEC)
        {
                 if (charDEC >=  0x3400 && charDEC <=  0x4EBF) return "中日韓統一表意文字擴展A區";
            else if (charDEC >=  0x4E00 && charDEC <=  0x9FFF) return "中日韓統一表意文字";
            else if (charDEC >=  0xF900 && charDEC <=  0xFAFF) return "中日韓相容表意文字";
            else if (charDEC >= 0x20000 && charDEC <= 0x2A6DF) return "中日韓統一表意文字擴展B區";
            else if (charDEC >= 0x2A700 && charDEC <= 0x2B73F) return "中日韓統一表意文字擴展C區";
            else if (charDEC >= 0x2B740 && charDEC <= 0x2B81F) return "中日韓統一表意文字擴展D區";
            else if (charDEC >= 0x2B820 && charDEC <= 0x2CEAF) return "中日韓統一表意文字擴展E區";
            else if (charDEC >= 0x2CEB0 && charDEC <= 0x2EBEF) return "中日韓統一表意文字擴展F區";
            else if (charDEC >= 0x2F800 && charDEC <= 0x2FA1F) return "中日韓相容表意文字增補";
            else return "";
        }
        // (暫時)透過 C_CHARTextBox 帶動樹狀結構更動
        private void C_CHARTextBox_TextChanged(object sender, TextChangedEventArgs e)
        {
            // 定義部件字元矩陣、動態設定為0、將要拆分的字元放入0位
            // 這個是臨時的萬用字元儲存區
            List<CharList> charlist = new List<CharList>
            {
                new CharList() { Title = C_CHARTextBox.Text, Tag = 0, Parent = -1, Hiac = 0 }
            };
            int tag = 1;
            int hiac = 0;
            // 第一層
            for (int i = 0; i < charlist.Count(); i++)//lchar會隨著不斷找出部件而變多
            {

                // 開始拆解
                var res = (from c in CharDataSet.CharX where c.C_CHAR == charlist[i].Title select c.C_PTA).ToList();
                if (res.Count > 0)
                {
                    byte[] b = Encoding.UTF32.GetBytes(res[0]);
                    hiac = charlist[i].Hiac + 1; // 它是現在所搜尋字元的子成員所以層級要上加
                    if (res[0] == "N/A")
                    {// 不存在

                    }
                    else if (res[0] == charlist[i].Title)
                    {// 與自己相同

                    }
                    else
                    { // 存在且與自己不同
                        var resUni = new UTF32(res[0]);
                        IEnumerable<int> resUniDEC = resUni.UniDEC;
                        // 解析出不同字元，包括&;字元在內
                        string tmp = "";
                        for (int k = 0; k < resUni.CharLength; k++)
                        {
                            if (resUniDEC.ElementAt(k) >= 0x2FF0 && resUniDEC.ElementAt(k) <= 0x2FFF)
                            {
                                // 表意文字序列
                            }
                            else if (resUniDEC.ElementAt(k) >= 0x21 && resUniDEC.ElementAt(k) <= 0x7E) //只有英文/數字/基本控制符
                            {
                                if (resUniDEC.ElementAt(k) == 0x3B)// 尾
                                {
                                    charlist.Add(new CharList() { Title = tmp, Tag = tag, Parent = i, Hiac = hiac }); tag++;
                                }
                                else
                                {
                                    tmp += char.ConvertFromUtf32(resUniDEC.ElementAt(k));
                                }
                            }
                            else
                            {
                                tmp += char.ConvertFromUtf32(resUniDEC.ElementAt(k));
                                charlist.Add(new CharList() { Title = tmp, Tag = tag, Parent = i, Hiac = hiac }); tag++;
                                tmp = "";
                            }
                        }
                    }
                }

            }
            // 樹狀圖建立
            if (TrvMenu.Items.Count > 0) TrvMenu.Items.RemoveAt(0);
            List<MenuItem[]> charPartTreeMenu = new List<MenuItem[]>();
            int maxHiac = MaxHiac(charlist);
            List<int> endHiac = EndHiac(charlist);
            List<int> zoneHiac = ZoneHiac(charlist);
            MenuItem c0 = new MenuItem() { Title = charlist[0].Title, Tag = 0, Parent = -1, Hiac = 0 };
            MenuItem[] c1 = new MenuItem[1];
            MenuItem[] c2 = new MenuItem[1];
            MenuItem[] c3 = new MenuItem[1];
            MenuItem[] c4 = new MenuItem[1];
            MenuItem[] c5 = new MenuItem[1];
            int[] ct = new int[] { 0, 0, 0, 0, 0, 0 };
            for (int i = 1; i < charlist.Count(); i++)
            {
                if (charlist[i].Parent == 0)
                {
                    c1[ct[1]] = new MenuItem() { Title = charlist[i].Title, Tag = i, Parent = charlist[i].Parent, Hiac = 1 };
                    c0.Items.Add(c1[ct[1]]); ct[1]++;
                    Array.Resize(ref c1, ct[1] + 1);
                }
                else if (charlist[i].Parent > endHiac[0] && charlist[i].Parent <= endHiac[1])
                {
                    for (int j = 0; j < ct[1]; j++)
                    {
                        if (c1[j].Tag == charlist[i].Parent)
                        {
                            c2[ct[2]] = new MenuItem() { Title = charlist[i].Title, Tag = i, Parent = charlist[i].Parent, Hiac = 2 };
                            c1[j].Items.Add(c2[ct[2]]); ct[2]++;
                            Array.Resize(ref c2, ct[2] + 1);
                        }
                    }
                }
                else if (charlist[i].Parent > endHiac[1] && charlist[i].Parent <= endHiac[2])
                {
                    for (int j = 0; j < ct[2]; j++)
                    {
                        if (c2[j].Tag == charlist[i].Parent)
                        {
                            c3[ct[3]] = new MenuItem() { Title = charlist[i].Title, Tag = i, Parent = charlist[i].Parent, Hiac = 3 };
                            c2[j].Items.Add(c3[ct[3]]); ct[3]++;
                            Array.Resize(ref c3, ct[3] + 1);
                        }
                    }
                }
                else if (charlist[i].Parent > endHiac[2] && charlist[i].Parent <= endHiac[3])
                {
                    for (int j = 0; j < ct[3]; j++)
                    {
                        if (c3[j].Tag == charlist[i].Parent)
                        {
                            c4[ct[4]] = new MenuItem() { Title = charlist[i].Title, Tag = i, Parent = charlist[i].Parent, Hiac = 4 };
                            c3[j].Items.Add(c4[ct[4]]); ct[4]++;
                            Array.Resize(ref c4, ct[4] + 1);
                        }
                    }
                }
            }
            TrvMenu.Items.Add(c0);
        }
        public class MenuItem
        {
            public MenuItem()
            {
                Items = new List<MenuItem>();
            }
            public string Title { get; set; } // 放置字元
            public int Tag { get; set; } // 流水指標
            public int Parent { get; set; } // 父指標
            public int Hiac { get; set; } // 層指標
            public List<MenuItem> Items { get; set; }
        }
        public class CharList
        {
            public string Title { get; set; } // 放置字元
            public int Tag { get; set; } // 流水指標
            public int Parent { get; set; } // 父指標
            public int Hiac { get; set; } // 層指標
        }
        public int MaxHiac(List<CharList> charlist)
        {
            int max = 0;
            foreach (CharList cl in charlist) max = (cl.Hiac > max) ? cl.Hiac : max;
            return max;
        }
        public List<int> EndHiac(List<CharList> charlist)
        {
            int tmp = 0;
            List<int> lint = new List<int>();
            foreach (CharList cl in charlist)
            {
                if (tmp < cl.Hiac)
                {
                    tmp = cl.Hiac;
                    lint.Add(cl.Tag - 1);
                }
            }
            lint.Add(charlist.Count() - 1);
            return lint;
        }
        public List<int> ZoneHiac(List<CharList> charlist)
        {
            int tmpHiac = 0; int tmp = 0;
            List<int> lint = new List<int>();
            foreach (CharList cl in charlist)
            {
                if (tmpHiac == cl.Hiac)
                {
                    tmp++;
                }
                else if (tmpHiac < cl.Hiac)
                {
                    lint.Add(tmp + 1);
                    tmpHiac = cl.Hiac; tmp = 0;
                }
            }
            lint.Add(tmp + 1);
            return lint;
        }
        // 當樹狀結構選擇對象改變時
        private void TrvMenu_SelectedItemChanged(object sender, RoutedPropertyChangedEventArgs<object> e)
        {
            var tree = sender as TreeView;
            if (tree.SelectedItem is MenuItem item)
            {
                // 更新歷史查詢區
                UpdateSearchHistory();
                // 開始新查詢
                StatusText.Text = "選取樹狀結構：" + item.Title;
                var res = (from c in CharDataSet.CharX where c.C_CHAR == item.Title select c).ToList();
                currentcharID = res[0].C_ID;
                charXViewSource.View.MoveCurrentToPosition(currentcharID - 1);
            }
            else if (tree.SelectedItem is string)
            {
                StatusText.Text = "選取字元：" + tree.SelectedItem.ToString();
            }


        }

        /// <標記開始：這裡記載了所有有關於大區的資訊和中英文對照>
        ///  0 CJK Unified Ideographs                  中日韓統一表意文字       
        ///  1 CJK Unified Ideographs Extension A      中日韓統一表意文字擴展A區 
        ///  2 CJK Unified Ideographs Extension B      中日韓統一表意文字擴展B區 
        ///  3 CJK Unified Ideographs Extension C      中日韓統一表意文字擴展C區 
        ///  4 CJK Unified Ideographs Extension D      中日韓統一表意文字擴展D區 
        ///  5 CJK Unified Ideographs Extension E      中日韓統一表意文字擴展E區 
        ///  6 CJK Unified Ideographs Extension F      中日韓統一表意文字擴展F區 
        /// 11 CJK Compatibility Ideographs            中日韓相容表意文字  
        /// 12 CJK Compatibility Ideographs Supplement 中日韓相容表意文字增補    
        /// <標記結束>

        /// <標記開始：以下為測試區>
        delegate int power2(int x);
        private void Button_Click(object sender, RoutedEventArgs e)
        {
            power2 p2 = x => x * x;
            MessageBox.Show(p2(9).ToString());
        }
        private void TBPH_TextChanged(object sender, TextChangedEventArgs e)
        {
            TextBox tb = (TextBox)sender;
            tb.Visibility = tb.Text.Contains("N/A") ? Visibility.Hidden : Visibility.Visible;
            //if (tb.Text.Contains("N/A")) tb.Text = "";
        }

        private void OutputExecute_Click(object sender, RoutedEventArgs e)
        {
            try { 
                string sep = "";
                if (Globals.b_OutputSeparate)
                {
                    sep = Globals.s_OutputSeparate;
                }

                string tmp = "";
                // 選擇輸出所有頁面的字
                if (Globals.b_OutputAllPages)
                {
                    for (int i = 0; i < Globals.gres.Res.Count(); i++)
                    {
                        if (Globals.b_OutputFontSupported)
                        { 
                            if (Globals.gres.Res_fontAval[i])
                            {
                                if (tmp == "")
                                    tmp += (Globals.gres.Res[i].C_CHAR);
                                else
                                    tmp += (sep + Globals.gres.Res[i].C_CHAR);
                            }
                        } else {
                            if (tmp == "")
                                tmp += (Globals.gres.Res[i].C_CHAR);
                            else
                                tmp += (sep + Globals.gres.Res[i].C_CHAR);
                        }
                    }
                } else {
                    // 不然就只輸出當頁的字
                    
                    int charPage = Convert.ToInt16(CharBlockTextBox.Text);
                    int charS = 64 * charPage;
                    int charE = Globals.gres.Res.Count() < 64 * (charPage + 1) ? Globals.gres.Res.Count() : 64 * (charPage + 1);
                    for (int i = charS; i < charE; i++)
                    {
                        if (Globals.b_OutputFontSupported)
                        {
                            if (Globals.gres.Res_fontAval[i])
                            {
                                if (tmp == "")
                                    tmp += (Globals.gres.Res[i].C_CHAR);
                                else
                                    tmp += (sep + Globals.gres.Res[i].C_CHAR);
                            }
                        }
                        else
                        {
                            if (tmp == "")
                                tmp += (Globals.gres.Res[i].C_CHAR);
                            else
                                tmp += (sep + Globals.gres.Res[i].C_CHAR);
                        }
                    }
                }
                OutputTextBox.Text = tmp;
                TabItemOutput.IsSelected = true;
            } catch (Exception ex) {
                Console.Write(ex.Message);
            }
        }

        private void SearchClearKXRDC_Click(object sender, RoutedEventArgs e)
        {
            foreach (ToggleButton btn in SearchPanelKXRDC.Children) btn.IsChecked = false;
            Globals.l_KX.Clear();
        }

        private void SearchClearPT_Click(object sender, RoutedEventArgs e)
        {
            foreach (ToggleButton btn in SearchPanelPTKXRDC.Children)  btn.IsChecked = false;
            foreach (ToggleButton btn in SearchPanelPTNormal.Children) btn.IsChecked = false;
            foreach (ToggleButton btn in SearchPanelPTCustom.Children) btn.IsChecked = false;
            Globals.l_PTKXRDC.Clear();
            Globals.l_PTNormal.Clear();
            Globals.l_PTCustom.Clear();
        }

        private void SearchClearSTKT_Click(object sender, RoutedEventArgs e)
        {
            foreach (ToggleButton btn in SearchPanelSTKT.Children) btn.IsChecked = false;
            Globals.l_STKT.Clear();
        }

        private void SearchClearWX_Click(object sender, RoutedEventArgs e)
        {
            foreach (ToggleButton btn in SearchPanelWX.Children) btn.IsChecked = false;
            Globals.l_WX.Clear();
        }

        private void SearchClearFreq_Click(object sender, RoutedEventArgs e)
        {
            RadBtnD.IsChecked = true;
            SliderA.Value = 13;
            SliderS.Value =  7;
            SliderT.Value = 10;
        }

        private void SearchClearZone_Click(object sender, RoutedEventArgs e)
        {
            foreach (ToggleButton btn in SearchPanelZone.Children) btn.IsChecked = false;
            Globals.l_Zone.Clear();
        }

        private void TrvExtendBtn_Click(object sender, RoutedEventArgs e)
        {
            //ToggleButton btn = (ToggleButton)sender;
            //btn.IsChecked = !btn.IsChecked;
        }

        private void TrvExtendBtn_Checked(object sender, RoutedEventArgs e)
        {
            ToggleButton btn = (ToggleButton)sender;
            if (btn.IsChecked.TrueBool()) {

            }
        }

        /// <標記結束>
        /// <已廢棄不用>
        // 存放已廢棄不用但不急著刪掉的程式碼
        // 標準函式：確認字元區裡某個字體是否支援某些字元
        //private void IfFontSupportingChar_CharBlock(string font)
        //{
        //    try
        //    {
        //        // 先清除所有高亮
        //        ClearCharBlockPanelBackground();
        //        FontFamily family = new FontFamily(font);
        //        foreach (Button btn in CharBlockPanel.Children)
        //        {
        //            var typefaces = family.GetTypefaces();
        //            foreach (Typeface typeface in typefaces)
        //            {
        //                typeface.TryGetGlyphTypeface(out GlyphTypeface glyph);
        //                if (glyph != null && glyph.CharacterToGlyphMap.TryGetValue(Convert.ToInt32(btn.Tag), out ushort glyphIndex))
        //                {
        //                    family.FamilyNames.TryGetValue(XmlLanguage.GetLanguage("zh-tw"), out string familyName);
        //                    //Console.WriteLine(familyName + " Supports " + Convert.ToInt32(btn.Tag));
        //                    if ((btn.Content).ToString() != "") btn.Background = Brushes.Gold;
        //                    break;
        //                }
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        Console.Write(ex.Message);
        //    }
        //}
        // 標準函式：確認字元區裡某個字體是否支援某些字元
        //private void IfFontSupportingChar(List<CharDataSet.CharXRow> schar, string font)
        //{

        //Globals.btn_Char_info = new List<string>(schar.Count);
        //int count = 0;
        //FontFamily family = new FontFamily(font);
        //foreach (CharDataSet.CharXRow c in schar)
        //{
        //    var typefaces = family.GetTypefaces();
        //    foreach (Typeface typeface in typefaces)
        //    {
        //        typeface.TryGetGlyphTypeface(out GlyphTypeface glyph);
        //        if (glyph != null && glyph.CharacterToGlyphMap.TryGetValue(Convert.ToInt32(c.C_UDEC), out ushort glyphIndex))
        //        {
        //            family.FamilyNames.TryGetValue(XmlLanguage.GetLanguage("en-us"), out string familyName);
        //            Console.WriteLine(familyName + " Supports " + Convert.ToInt32(c.C_UDEC));

        //            count++;
        //            break;
        //        }
        //    }
        //}
        //}
        /// </已廢棄不用>

    }
}
namespace JEKExt
{
    namespace Type
    {
        public static class Type
        {
            // 將不定型態bool?明確轉換成bool(預設無值為false)
            public static bool TrueBool(this bool? boo)
            {
                if (!boo.HasValue) boo = false;
                return (bool)boo;
            }
        }
    }
    namespace UTFChar
    {
        public class UTF32
        {
            private byte[] strbyte;
            private int    charlength;
            public enum TYPE : int
            {
                Unknown = -1,
                BMP     =  0,
                SMP     =  1,
                SIP     =  2,
                TIP     =  3,
                SSP     = 14,
                PUA_A   = 15,
                PUA_B   = 16,
                EndofType
            }
            // 初始化
            public UTF32(string str)
            {
                strbyte = Encoding.UTF32.GetBytes(str);
                charlength = strbyte.Count() / 4;
            }
            // 傳回字元碼
            public IEnumerable<int> UniDEC
            {
                get { return Uni; }
            }
            // 傳回字元長度
            public int CharLength
            {
                get { return charlength; }
            }
            // 傳回所有字元的UTF32值，不受BMP限制
            private IEnumerable<int> Uni
            {
                get
                {
                    // UTF32每4個bytes成一字元
                    int[] charint = { };
                    Array.Resize(ref charint, strbyte.Count() / 4);
                    int tmpInt = 0;
                    for (int k = 0; k < charlength; k++)
                    {
                        tmpInt = 0;
                        for (int j = 0; j < 4; j++)
                        {
                            tmpInt += Convert.ToInt32(Math.Pow(2, j * 8)) * strbyte[j + (k * 4)];
                        }
                        charint[k] = tmpInt;
                    }
                    return charint;
                }
            }
            // 傳回字元所在的Unicode大區
            public TYPE GetSingleCharType
            {
                get
                { 
                    if (strbyte.Count() == 4 && strbyte[2] < (byte)TYPE.EndofType) { 
                        return (TYPE)strbyte[2];
                    } else { 
                        return TYPE.Unknown;
                    }
                }
            }
            // 是否字串所有字元都只在BMP範圍內
            public bool IsOnlyBMP
            {
                get
                {
                    for (int i=0; i<charlength; i++)
                        if (strbyte[4*i+2] > 0)
                            return false;
                    return true;
                }
            }
            // 是否字串所有字元都是英文
            public bool IsOnlyEng
            {
                get
                {
                    for (int i = 0; i < charlength; i++)
                    {
                        if (strbyte[4*i]   <  33 || strbyte[4*i]   > 126 || 
                            strbyte[4*i+1] !=  0 || strbyte[4*i+2] !=  0 || strbyte[4*i+3] != 0)
                        { return false; }
                    }
                    return true;
                }
            }
        }
    }
}


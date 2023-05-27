using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Resources;
using System.Security.Cryptography.X509Certificates;
using System.Windows.Media;
using System.Drawing;
using System.Runtime.CompilerServices;
using Color = System.Windows.Media.Color;

using OFT.Attributes;
using OFT.Rendering;
using OFT.Rendering.Tools;
using OFT.Rendering.Context;
using OFT.Rendering.Settings;

using ATAS.Indicators.Technical.Properties;
using ATAS.Indicators;
using ATAS.Indicators.Drawing;


using Utils.Common.Localization;

namespace ATAS.Indicators.Technical
{
    [DisplayName("Fair Value Gaps")]
    public class FVG : Indicator
    {
        // Variables
        private  Color chartCss;
        private  FVG sfvg;
        private  SessionRange sesr;
        private  Box area;
        private  Line avg;

        private  bool bullFVG;
        private  bool bearFVG;

        private  bool bullIsNew = false;
        private  bool bearIsNew = false;
        private  bool bullMitigated = false;
        private  bool bearMitigated = false;
        private  bool withinBullFVG = false;
        private  bool withinBearFVG = false;

        [Display(Name = "FVG Level", GroupName = "Bull", Order = 0)]
        public Color BullCss { get; set; } = Color.FromArgb(255, 0, 128, 128); // Dark teal

        [Display(Name = "Area", GroupName = "Bull", Order = 1)]
        public Color BullAreaCss { get; set; } = Color.FromArgb(50, 0, 128, 128); // Dark teal with transparency

        [Display(Name = "Mitigated", GroupName = "Bull", Order = 2)]
        public Color BullMitigatedCss { get; set; } = Color.FromArgb(80, 0, 128, 128); // Dark teal with transparency

        [Display(Name = "FVG Level", GroupName = "Bear", Order = 0)]
        public Color BearCss { get; set; } = Color.FromArgb(255, 255, 0, 0); // Dark red

        [Display(Name = "Area", GroupName = "Bear", Order = 1)]
        public Color BearAreaCss { get; set; } = Color.FromArgb(50, 255, 0, 0); // Dark red with transparency

        [Display(Name = "Mitigated", GroupName = "Bear", Order = 2)]
        public Color BearMitigatedCss { get; set; } = Color.FromArgb(80, 255, 0, 0); // Dark red with transparency

        public FVG()
            : base(useCandles: true)
        {

            DenyToChangePanel = true;
            EnableCustomDrawing = true;
            SubscribeToDrawingEvents(DrawingLayouts.Historical);
            DrawAbovePrice = false;

        }
        public class FVG_
        {
            float Top;
            float Bottom;
            bool Mitigated;
            bool IsNew;
            bool IsBull;
            Line Lvl;
            Box Area;

        }


        public class SessionRange
        {
            public Line Max { get; set; }
            public Line Min { get; set; }
        }


        public class Data
        {
            public float High { get; set; }
            public float Low { get; set; }
            public float Close { get; set; }
            public float Length { get; set; }
        }

        public class Box
        {
            public float X1 { get; set; }
            public float Y1 { get; set; }
            public float X2 { get; set; }
            public float Y2 { get; set; }
            public Color? BorderColor { get; set; }
            public Color? FillColor { get; set; }

            public Box(float x1, float y1, float x2, float y2, Color? borderColor, Color? fillColor)
            {
                X1 = x1;
                Y1 = y1;
                X2 = x2;
                Y2 = y2;
                BorderColor = borderColor;
                FillColor = fillColor;
            }
        }

        public class Line
        {
            public float X1 { get; set; }
            public float Y1 { get; set; }
            public float X2 { get; set; }
            public float Y2 { get; set; }
            public Color? Color { get; set; }
            public LineStyle? Style { get; set; }

            public Line(float x1, float y1, float x2, float y2, Color? color, LineStyle? style)
            {
                X1 = x1;
                Y1 = y1;
                X2 = x2;
                Y2 = y2;
                Color = color;
                Style = style;
            }

            public void SetColor(Color? color)
            {
                Color = color;
            }
        }

        public enum LineStyle
        {
            Solid,
            Dashed,
            Dotted
        }

        public enum Extend
        {
            Neither,
            Left,
            Right,
            Both
        }
        private static void SetRange(SessionRange range, float high, float low)
        {
            range.Max.SetXY2(n, Math.Max(high, range.Max.GetY2()));
            range.Max.SetY1(Math.Max(high, range.Max.GetY2()));

            range.Min.SetXY2(n, Math.Min(low, range.Min.GetY2()));
            range.Min.SetY1(Math.Min(low, range.Min.GetY2()));
        }

        private static void SetFVG(FVG id, int offset, Color bgCss, Color lineCss)
        {
            float avg = (id.Top + id.Bottom) / 2;

            id.Area = new Box(n - offset, id.Top, n, id.Bottom, null, bgCss);
            id.Lvl = new Line(n - offset, avg, n, avg, lineCss, LineStyle.Dashed);
        }
        private static bool IsNewSession(Data[] Data, int index)
        {
            // Implement the logic to check if a new session has started based on your Data
            // You can use the index and Data array to determine the start of a new session
            // Return true if it is a new session, false otherwise
            return false;
        }

        protected override void OnCalculate(int bar, decimal value)
        {
            //var n = bar;
            



            // Start processing Data
            for (int n = bar; n < Data.Length; n++)
            {
                float high = bar.High;
                float low = Data[n].Low;
                float close = Data[n].Close;

                // New session
                if (IsNewSession(Data, n))
                {
                    // Set delimiter
                    DrawLine(n, high + syminfo.mintick, n, low - syminfo.mintick, chartCss, LineStyle.Dashed, Extend.Both);

                    // Set new range
                    sesr = new SessionRange
                    {
                        Max = DrawLine(n, high, n, high, chartCss),
                        Min = DrawLine(n, low, n, low, chartCss)
                    };

                    sfvg.IsNew = true;

                    // Set prior session fvg right coordinates
                    if (sfvg.Lvl != null)
                    {
                        sfvg.Lvl.X2 := n - 2;
                        sfvg.Area.SetRight(n - 2);
                    }
                }
                // Set range
                else if (sesr != null)
                {
                    SetRange(sesr, high, low);
                    sesr.Max.SetColor(sfvg.IsBull ? bullCss : bearCss);
                    sesr.Min.SetColor(sfvg.IsBull ? bullCss : bearCss);
                }

                // Set FVG
                if (bullFVG && sfvg.IsNew)
                {
                    sfvg = new FVG { Top = low, Bottom = high[2], Mitigated = false, IsNew = false, IsBull = true };
                    SetFVG(sfvg, 2, bullAreaCss, bullCss);
                    bullIsNew = true;
                }
                else if (bearFVG && sfvg.IsNew)
                {
                    sfvg = new FVG { Top = low[2], Bottom = high, Mitigated = false, IsNew = false, IsBull = false };
                    SetFVG(sfvg, 2, bearAreaCss, bearCss);
                    bearIsNew = true;
                }

                if (!sfvg.Mitigated)
                {
                    if (sfvg.IsBull && close < sfvg.Bottom)
                    {
                        SetFVG(sfvg, 1, bullMitigatedCss, bullCss);
                        sfvg.Mitigated = true;
                        bullMitigated = true;
                    }
                    else if (!sfvg.IsBull && close > sfvg.Top)
                    {
                        SetFVG(sfvg, 1, bearMitigatedCss, bearCss);
                        sfvg.Mitigated = true;
                        bearMitigated = true;
                    }
                }

                if (!sfvg.IsNew)
                {
                    sfvg.Lvl.X2 = n;
                    sfvg.Area.SetRight(n);
                }

                // Check conditions
                // ...
            }
        }


       
    }
}

        // Define other helper methods and classes as needed

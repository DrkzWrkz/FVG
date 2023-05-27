using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Resources;
using System.Security.Cryptography.X509Certificates;
using System.Windows.Media;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Linq;
using System.Collections.Generic;
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
        private Highest High = new Highest();
        private Lowest Low = new Lowest();

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
        
        protected override void OnCalculate(int bar, decimal value)
        {
            var n = bar;
            var dtf = TimeFrame == "Daily";

            // On new session
            if (dtf)
            {
                // Set delimiter
                var delimiter = new Line(n, High + InstrumentInfo.TickSize, n, Low - InstrumentInfo.TickSize, Colors.White,LineStyle.Dashed)
                {
                    Color = ChartCss,
                    Style = LineStyle.Dashed,
                    Extend = LineExtend.Both
                };

                // Set new range
                var sesr = new SessionRange(
                    new LineObject(n, High, n, High) { Color = ChartCss },
                    new LineObject(n, Low, n, Low) { Color = ChartCss }
                );

                sfvg.IsNew = true;

                // Set prior session fvg right coordinates
                if (sfvg.Lvl != null)
                {
                    sfvg.Lvl.X2 = n - 2;
                    sfvg.Area.Right = n - 2;
                }
            }
            // Set range
            else if (sesr != null)
            {
                sesr.SetRange();

                // Set range lines color
                sesr.Max.Color = sfvg.IsBull ? BullCss : BearCss;
                sesr.Min.Color = sfvg.IsBull ? BullCss : BearCss;
            }

            // Set FVG
            // New session bullish fvg
            if (bull_fvg && sfvg.IsNew)
            {
                sfvg = new Fvg(low, high[2], false, false, true);
                sfvg.SetFvg(2, BullAreaCss, BullCss);

                bull_isnew = true;
            }
            // New session bearish fvg
            else if (bear_fvg && sfvg.IsNew)
            {
                sfvg = new Fvg(low[2], high, false, false, false);
                sfvg.SetFvg(2, BearAreaCss, BearCss);

                bear_isnew = true;
            }

            // Change object transparencies if mitigated
            if (!sfvg.Mitigated)
            {
                // If session fvg is bullish
                if (sfvg.IsBull && close < sfvg.Btm)
                {
                    sfvg.SetFvg(1, BullMitigatedCss, BullCss);

                    sfvg.Mitigated = true;
                    bull_mitigated = true;
                }
                // If session fvg is bearish
                else if (!sfvg.IsBull && close > sfvg.Top)
                {
                    sfvg.SetFvg(1, BearMitigatedCss, BearCss);

                    sfvg.Mitigated = true;
                    bear_mitigated = true;
                }
            }

            // Set fvg right coordinates to current bar
            if (!sfvg.IsNew)
            {
                sfvg.Lvl.X2 = n;
                sfvg.Area.Right = n;
            }


            void SetFVG(FVG id, int offset, Color bgCss, Color lineCss)
            {
                float avg = (id.Top + id.Bottom) / 2;

                id.Area = new Box(n - offset, id.Top, n, id.Bottom, null, bgCss);
                id.Lvl = new Line(n - offset, avg, n, avg, lineCss, LineStyle.Dashed);
            }

            void SetRange(SessionRange range, float high, float low)
            {
                range.Max.SetXY2(n, Math.Max(high, range.Max.GetY2()));
                range.Max.SetY1(Math.Max(high, range.Max.GetY2()));

                range.Min.SetXY2(n, Math.Min(low, range.Min.GetY2()));
                range.Min.SetY1(Math.Min(low, range.Min.GetY2()));
            }

            if (bull_isnew)
            {
                AddAlert("Alert1", "Bullish FVG");
            }
            if (bear_isnew)
            {
                AddAlert("Alert1", "Bearish FVG");
            }
            if (bull_mitigated)
            {
                AddAlert("Alert1", "Mitigated Bullish FVG");
            }
            if (bear_mitigated)
            {
                AddAlert("Alert1", "Mitigated Bearish FVG");
            }
            if (within_bull_fvg)
            {
                AddAlert("Alert1", "Price Within Bullish FVG");
            }
            if (within_bear_fvg)
            {
                AddAlert("Alert1", "Price Within Bearish FVG");





            }



    }
}


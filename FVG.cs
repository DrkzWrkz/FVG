using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Resources;
using System.Windows.Media;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Linq;
using System.Collections.Generic;
using Color = System.Windows.Media.Color;
using Brushes = System.Drawing.Brushes;

using OFT.Attributes;
using OFT.Rendering;
using OFT.Rendering.Tools;
using OFT.Rendering.Context;
using OFT.Rendering.Settings;

using ATAS.Indicators.Technical.Properties;
using ATAS.Indicators;
using ATAS.Indicators.Drawing;

using Utils.Common.Localization;
using OFT.Core.Candles;
using DocumentFormat.OpenXml.Math;
using DocumentFormat.OpenXml.InkML;

namespace ATAS.Indicators.Technical
{
    [DisplayName("Fair Value Gaps")]
    public class FairValueGap : Indicator
    {

        // Variables
        private System.Drawing.Color chartCss;
        private  FVG sfvg;
        private  SessionRange sesr;
        private  Rectangle Area;
        private  Rectangle avgLine;
        //private Highest High = new Highest();
        //private Lowest Low = new Lowest();

        private  bool bullFVG = false;
        private  bool bearFVG = false;

        private  bool bullIsNew = false;
        private  bool bearIsNew = false;
        private  bool bullMitigated = false;
        private  bool bearMitigated = false;
        private  bool withinBullFVG = false;
        private  bool withinBearFVG = false;

        [Display(Name = "FVG Level", GroupName = "Bull", Order = 0)]
        public System.Drawing.Color BullCss { get; set; } = System.Drawing.Color.FromArgb(255, 0, 128, 128); // Dark teal

        [Display(Name = "Area", GroupName = "Bull", Order = 1)]
        public System.Drawing.Color BullAreaCss { get; set; } = System.Drawing.Color.FromArgb(50, 0, 128, 128); // Dark teal with transparency

        [Display(Name = "Mitigated", GroupName = "Bull", Order = 2)]
        public System.Drawing.Color BullMitigatedCss { get; set; } = System.Drawing.Color.FromArgb(80, 0, 128, 128); // Dark teal with transparency

        [Display(Name = "FVG Level", GroupName = "Bear", Order = 0)]
        public System.Drawing.Color BearCss { get; set; } = System.Drawing.Color.FromArgb(255, 255, 0, 0); // Dark red

        [Display(Name = "Area", GroupName = "Bear", Order = 1)]
        public System.Drawing.Color BearAreaCss { get; set; } = System.Drawing.Color.FromArgb(50, 255, 0, 0); // Dark red with transparency

        [Display(Name = "Mitigated", GroupName = "Bear", Order = 2)]
        public System.Drawing.Color BearMitigatedCss { get; set; } = System.Drawing.Color.FromArgb(80, 255, 0, 0); // Dark red with transparency

        public class FVG 
        {
            public float Top = 0;
            public float Bottom = 0;
            public bool Mitigated = false;
            public bool IsNew = false;
            public bool IsBull = false;
            public Rectangle Lvl = new Rectangle(0, 0, 0, 0);
            public Rectangle Area = new Rectangle(0, 0, 0, 0);

            public FVG(float Top, float Bottom, bool Mitigated, bool IsNew, bool IsBull) { }

        }
        


        public class SessionRange
        {
            public Rectangle Max = new Rectangle(0, 0, 0, 0);
            public Rectangle Min = new Rectangle(0, 0, 0, 0);
        }



        public FairValueGap()
            : base(useCandles: true)
        {

            DenyToChangePanel = true;
            EnableCustomDrawing = true;
            SubscribeToDrawingEvents(DrawingLayouts.Historical);
            DrawAbovePrice = false;
            
        }
        protected override void OnRender(RenderContext context, DrawingLayouts layout)
        {



        }


        protected override void OnCalculate(int bar, decimal value)
        {
            var n = bar; 
            var c = GetCandle(bar);
            var c1 = GetCandle(1);
            var c2 = GetCandle(2);
            var candle = GetCandle(bar);
            bool bullFVG = c.Low > c2.High && c1.Close > c2.High;
            bool bearFVG = c.High < c2.Low && c1.Close < c2.Low;

            void SetFVG(FVG id, int offset, System.Drawing.Color bgCss, System.Drawing.Color lCss)
            {

                float avg = (id.Top + id.Bottom) / 2;

                // Create a box object
                Rectangle Area = new Rectangle(((int)candle.Close) - offset, ((int)id.Top), ((int)candle.Close), ((int)id.Bottom));
                //context.FillRectangle(bgCss, rect: Area);


                // Create a line object
                Rectangle avgLine = new Rectangle((int)candle.Close - offset, (int)avg, (int)candle.Close, (int)avg);
                //context.FillRectangle(lCss, rect: avgLine);

                // Set the objects in the FVG object
                id.Lvl = avgLine;
                id.Area = Area;
            }

            void SetRange(SessionRange id)
            {
                decimal max = candle.High > id.Max.Height ? candle.High : id.Max.Height;
                decimal min = candle.High < id.Min.Height ? candle.High : id.Min.Height;

                id.Max.Width = (int)candle.Close;
                id.Max.Y = (int)max;
                id.Max.Height = (int)max;

                id.Min.Width = (int)candle.Close;
                id.Min.Y = (int)min;
                id.Min.Height = (int)min;
            }

            System.Drawing.Pen pen = new System.Drawing.Pen(chartCss);
            if (IsNewSession(bar))
            {

                DrawingRectangle Area = new DrawingRectangle( n, (int)c.High + (int)InstrumentInfo.TickSize, n, (int)c.Low - (int)InstrumentInfo.TickSize, pen , Brushes.Gray);

                // Set new range
                sesr = new SessionRange
                {
                    Max = new Rectangle(n, (int)c.High, n, (int)c.High),
                    Min = new Rectangle(n, (int)c.Low, n, (int)c.Low)
                };

                sfvg.IsNew = true;

                // Set prior session FVG right coordinates
                if (sfvg.Lvl != null)
                {
                    sfvg.Lvl.Width = n - 2;
                    sfvg.Area.Width = n - 2;
                }
            }
            else if (sesr != null)
            {
                SetRange(sesr);

                // Set range lines color
                //sesr.Max.Color = sfvg.IsBull ? BullCss : BearCss;
                //sesr.Min.Color = sfvg.IsBull ? BullCss : BearCss;
            }

            //-----------------------------------------------------------------------------}
            // Set FVG
            //-----------------------------------------------------------------------------{
            // New session bullish FVG
            if (bullFVG && sfvg.IsNew)
            {
                sfvg = new FVG((float)c.Low, (float)c2.High, false, false, true);
                SetFVG(sfvg, 2 , BullAreaCss, BullCss);

                bullIsNew = true;
            }

            // New session bearish FVG
            else if (bearFVG && sfvg.IsNew)
            {
                sfvg = new FVG((float)c2.Low, (float)c.High, false, false, false);
                SetFVG(sfvg,2, BearAreaCss, BearCss);

                bearIsNew = true;
            }

            // Change object transparencies if mitigated
            if (!sfvg.Mitigated)
            {
                // If session FVG is bullish
                if (sfvg.IsBull && (float)c.Close < sfvg.Bottom)
                {
                    SetFVG(sfvg,1, BullMitigatedCss, BullCss);

                    sfvg.Mitigated = true;
                    bullMitigated = true;
                }
                // If session FVG is bearish
                else if (!sfvg.IsBull && (float)c.Close > sfvg.Top)
                {
                    SetFVG(sfvg, 1, BearMitigatedCss, BearCss);

                    sfvg.Mitigated = true;
                    bearMitigated = true;
                }
            }

            // Set FVG right coordinates to current bar
            if (!sfvg.IsNew)
            {
                sfvg.Lvl.Width = n;
                sfvg.Area.Width = (n);
            }
            // On new session fvg
            if (bullIsNew)
                AddAlert("Bullish FVG", "New session bullish fvg");

            if (bearIsNew)
                AddAlert("Bearish FVG", "New session bearish fvg");

            // On fvg mitigation
            if (bullMitigated)
                AddAlert("Mitigated Bullish FVG", "Session bullish fvg has been mitigated");

            if (bearMitigated)
                AddAlert("Mitigated Bearish FVG", "Session bearish fvg has been mitigated");

            // If within fvg
            if ((float)c.Close >= sfvg.Bottom && (float)c.Close <= sfvg.Top && sfvg.IsBull && !sfvg.IsNew)
                AddAlert("Price Within Bullish FVG", "Price is within bullish fvg");

            if ((float)c.Close >= sfvg.Bottom && (float)c.Close <= sfvg.Top && !sfvg.IsBull && !sfvg.IsNew)
                AddAlert("Price Within Bearish FVG", "Price is within bearish fvg");

            // Calculate the average
            float average = (sfvg.Top + sfvg.Bottom) / 2;
            // On fvg average cross
            bool crossedBullish = ((float)c1.Close < average && (float)c.Close >= average);
            bool crossedBearish = ((float)c1.Close > average && (float)c.Close <= average);

            if (crossedBullish && sfvg.IsBull && !sfvg.IsNew)
                AddAlert("Bullish FVG AVG Cross", "Price crossed bullish fvg average");

            if (crossedBearish && !sfvg.IsBull && !sfvg.IsNew)
                AddAlert("Bearish FVG AVG Cross", "Price crossed bearish fvg average");

        }




    }
}


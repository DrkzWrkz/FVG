using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Resources;
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
using OFT.Core.Candles;
using DocumentFormat.OpenXml.Math;

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

        public class FVG 
        {
            public float Top = 0;
            public float Bottom = 0;
            public bool Mitigated = false;
            public bool IsNew = false;
            public bool IsBull = false;
            public Rectangle Lvl = new Rectangle(0, 0, 0, 0);
            public Rectangle Area = new Rectangle(0, 0, 0, 0);

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
        protected override void OnCalculate(int bar, decimal value)
        {
            var n = bar; 
            var c = GetCandle(bar);
            RenderPen pen = new RenderPen(chartCss);
            if (IsNewSession(bar))
            {
                RenderContext context;

                context.DrawLine(pen, n, (int)c.High + (int)InstrumentInfo.TickSize, n, (int)c.Low - (int)InstrumentInfo.TickSize);

                // Set new range
                sesr = new SessionRange
                {
                    Max = Chart.DrawLine(n, High, n, High, color: chartCss),
                    Min = Chart.DrawLine(n, Low, n, Low, color: chartCss)
                };

                sfvg.isNew = true;

                // Set prior session FVG right coordinates
                if (sfvg.lvl != null)
                {
                    sfvg.lvl.X2 = n - 2;
                    sfvg.area.SetRight(n - 2);
                }
            }
            else if (sesr != null)
            {
                SetRange(sesr);

                // Set range lines color
                sesr.Max.Color = sfvg.isBull ? BullCss : BearCss;
                sesr.Min.Color = sfvg.isBull ? BullCss : BearCss;
            }

            //-----------------------------------------------------------------------------}
            // Set FVG
            //-----------------------------------------------------------------------------{
            // New session bullish FVG
            if (bull_fvg && sfvg.isNew)
            {
                sfvg = new FVG(low, High[2], false, false, true);
                sfvg.SetFVG(2, BullAreaCss, BullCss);

                bull_isnew = true;
            }

            // New session bearish FVG
            else if (bear_fvg && sfvg.isNew)
            {
                sfvg = new FVG(Low[2], high, false, false, false);
                sfvg.SetFVG(2, BearAreaCss, BearCss);

                bear_isnew = true;
            }

            // Change object transparencies if mitigated
            if (!sfvg.mitigated)
            {
                // If session FVG is bullish
                if (sfvg.isBull && close < sfvg.btm)
                {
                    sfvg.SetFVG(1, BullMitigatedCss, BullCss);

                    sfvg.mitigated = true;
                    bull_mitigated = true;
                }
                // If session FVG is bearish
                else if (!sfvg.isBull && close > sfvg.top)
                {
                    sfvg.SetFVG(1, BearMitigatedCss, BearCss);

                    sfvg.mitigated = true;
                    bear_mitigated = true;
                }
            }

            // Set FVG right coordinates to current bar
            if (!sfvg.isNew)
            {
                sfvg.lvl.X2 = n;
                sfvg.area.SetRight(n);
            }

        }


        
        protected override void OnRender(RenderContext context, DrawingLayouts layout)
        {
            var candle = GetCandle(0);

            void SetFVG(FVG id, int offset, System.Drawing.Color bgCss, System.Drawing.Color lCss)
            {

                float avg = (id.Top + id.Bottom) / 2;

                // Create a box object
                Rectangle Area = new Rectangle(((int)candle.Close) - offset, ((int)id.Top), ((int)candle.Close), ((int)id.Bottom));
                context.FillRectangle(bgCss,rect:Area);


                // Create a line object
                Rectangle avgLine = new Rectangle((int)candle.Close - offset, (int)avg, (int)candle.Close, (int)avg);
                context.FillRectangle(lCss, rect:avgLine);

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


        }

    }
}


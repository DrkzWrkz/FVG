using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Drawing;
using System.Runtime.InteropServices;
//using Color = System.Windows.Media.Color;

//using OFT.Core;
//using OFT.Localization;
using OFT.Rendering.Context;
using OFT.Rendering;
using OFT.Attributes;

using ATAS.Indicators;
using ATAS.Indicators.Drawing;
using ATAS.Indicators.Technical;
using ATAS.Indicators.Technical.Properties;

using Brushes = System.Drawing.Brushes;
using Color = System.Drawing.Color;


using System.Windows.Media;
using System.Xml.Linq;
using Utils.Common;

namespace ATAS.Indicators.Technical
{
    [DisplayName("FVG Sessions [LuxAlgo]")]
    public class FVGIndicator : Indicator
    {
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

        public class Fvg
        {
            public float Top { get; set; }
            public float Bottom { get; set; }
            public bool Mitigated { get; set; }
            public bool IsNew { get; set; }
            public bool IsBullish { get; set; }
            public LineSeries Level { get; set; }
            public DrawingRectangle Area { get; set; }
        }

        public class SessionRange
        {
            public LineSeries Max { get; set; }
            public LineSeries Min { get; set; }
        }

        protected override void OnCalculate(int bar, decimal value)
        {
            var candle = bar;
            var lastCandle = bar - 1;
            var bLastCandle = bar - 2;

            // Method for setting fair value gaps
            void SetFvg(Fvg id, int offset, Color bgCss, Color lCss)
            {
                double avg = (id.Top + id.Bottom) / 2.0;

                Rectangle area = new Rectangle
                {
                    Width = candle - offset,
                    Height = ((int)id.Top),
                    Y = candle,
                    X = ((int)id.Bottom),

                };

                LineSeries avgL = new LineSeries("avgL")
                {
                    Width = n - offset,
                    Y1 = avg,
                    X2 = n,
                    Y2 = avg,
                    Color = lCss,
                    LineDashStyle = Dashed
                };

                id.Level = avgL;
                id.Area = area;
            }

        }



        // Method for setting session range maximum/minimum
        private void SetRange(SessionRange id)
        {
            double max = Math.Max(High[0], id.Max.Y2);
            double min = Math.Min(Low[0], id.Min?.Y2 ?? 0.0);

            id.Max.X2 = n;
            id.Max.Y1 = max;
            id.Max.Y2 = max;

            id.Min ??= new LineSeries();
            id.Min.X2 = n;
            id.Min.Y1 = min;
            id.Min.Y2 = min;
        }
    }
}
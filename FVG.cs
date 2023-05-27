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
using DocumentFormat.OpenXml.Vml;
using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Office2010.Excel;

namespace ATAS.Indicators.Technical
{
    [DisplayName("Fair Value Gaps")]
    public class FVG : Indicator
    {

        private float Top;
        private float Bottom;
        private bool Mitigated = false;
        private bool IsNew = false;
        private bool IsBull = false;
        private LineSeries Lvl = new LineSeries("Level");
        private DrawingRectangle Area;

        // Variables
        private Color chartCss;
        private  FVG sfvg;
        private  SessionRange sesr;
        private  DrawingRectangle area;
        private  LineSeries avg;
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
        public class SessionRange
        {
            public LineSeries Max { get; set; }
            public LineSeries Min { get; set; }
        }

        public FVG()
            : base(useCandles: true)
        {

            DenyToChangePanel = true;
            EnableCustomDrawing = true;
            SubscribeToDrawingEvents(DrawingLayouts.Historical);
            DrawAbovePrice = false;



        }
        protected override void OnCalculate(int bar, decimal value)
        {
            

        }

    }
}


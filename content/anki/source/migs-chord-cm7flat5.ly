\version "2.26.0"
\header { tagline = ##f }
#(set-global-staff-size 26)
\paper { indent = 0\mm line-width = 55\mm paper-width = 62\mm paper-height = 35\mm top-margin = 3\mm ragged-right = ##f }
\score { \new Staff { \clef treble \omit Staff.TimeSignature \cadenzaOn <c' ees' ges' bes'>1 \bar "" } \layout { \context { \Score \omit BarNumber } } }

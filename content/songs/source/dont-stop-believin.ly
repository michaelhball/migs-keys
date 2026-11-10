\version "2.26.0"
\header { title = "Don’t Stop Believin’" subtitle = "Piano accompaniment · tutorial-based practice arrangement" composer = "Journey" tagline = ##f }
#(set-global-staff-size 18)
\paper { top-margin = 10\mm bottom-margin = 10\mm ragged-last-bottom = ##t }
\score {
\new PianoStaff <<
\new Staff = "up" {
\clef treble \key e \major \numericTimeSignature \time 4/4 \tempo 4 = 119
\mark \markup \small "Intro"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 1
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 2
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 3
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 b8 | \break % bar 4
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 5
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 6
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 7
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 b8 | \break % bar 8
\mark \markup \small "Verse 1"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 9
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 10
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 11
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 12
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 13
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 14
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 15
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 16
\mark \markup \small "Verse 2"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 17
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 18
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 19
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 20
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 21
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 22
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 23
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 24
\mark \markup \small "Instrumental"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 25
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 26
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 27
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 28
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 29
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 30
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 31
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>4 <b e' b'>8 <b e' b'>8~ | \break % bar 32
\mark \markup \small "Verse 3"
<b e' b'>4 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 33
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 34
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 35
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 36
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 37
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 38
<b dis' b'>4 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 | % bar 39
<a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 | \break % bar 40
\mark \markup \small "Strangers"
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 41
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 42
<fis' b' dis''>8 r8 r8 <e' gis' b'>8 r2 | % bar 43
<fis' b' dis''>8 r8 r8 <gis' b' e''>8 r2 | \break % bar 44
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 45
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 46
<fis' b' dis''>8 r8 r8 <e' gis' b'>8 r2 | % bar 47
<fis' b' dis''>8 r8 r8 <gis' b' e''>8 r2 | \break % bar 48
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 49
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 50
<fis' b' dis''>8 r8 r8 <e' gis' b'>8 r2 | % bar 51
<fis' b' dis''>8 r8 r8 <gis' b' e''>8 r2 | \break % bar 52
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 53
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 54
<fis' b' dis''>4. <gis' b' e''>8~ <gis' b' e''>2 | % bar 55
<fis' b' dis''>4 <gis' b' e''>8 <a' cis'' e''>8~ <a' cis'' e''>2 | \break % bar 56
\mark \markup \small "Turnaround"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 57
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 58
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 59
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 60
\mark \markup \small "Verse 4"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 61
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 62
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 63
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 64
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 65
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 66
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 67
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 68
\mark \markup \small "Verse 5"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 69
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 70
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 71
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 72
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 73
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 74
<b dis' b'>4 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 <b dis' b'>8 | % bar 75
<a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 <a cis' a'>8 | \break % bar 76
\mark \markup \small "Strangers (return)"
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 77
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 78
<fis' b' dis''>8 r8 r8 <e' gis' b'>8 r2 | % bar 79
<fis' b' dis''>8 r8 r8 <gis' b' e''>8 r2 | \break % bar 80
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 81
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 82
<fis' b' dis''>8 r8 r8 <e' gis' b'>8 r2 | % bar 83
<fis' b' dis''>8 r8 r8 <gis' b' e''>8 r2 | \break % bar 84
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 85
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 86
<fis' b' dis''>8 r8 r8 <e' gis' b'>8 r2 | % bar 87
<fis' b' dis''>8 r8 r8 <gis' b' e''>8 r2 | \break % bar 88
<fis' b' dis''>8 r8 r8 <e' a' cis''>8 r2 | % bar 89
<fis' b' dis''>8 r8 r8 <gis' cis'' e''>8 r2 | % bar 90
<fis' b' dis''>4. <gis' b' e''>8~ <gis' b' e''>2 | % bar 91
<fis' b' dis''>4 <gis' b' e''>8 <a' cis'' e''>8~ <a' cis'' e''>2 | \break % bar 92
\mark \markup \small "Solo accompaniment"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 93
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 94
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 95
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 96
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 97
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 98
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 99
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 100
\mark \markup \small "Chorus"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 101
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 102
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 103
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 104
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 105
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 106
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 107
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 108
\mark \markup \small "Ending loop (once)"
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 109
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 110
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 111
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 112
<e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 <e' b'>8 b8 | % bar 113
<fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 <fis' b'>8 b8 | % bar 114
<dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 <dis' b'>8 b8 | % bar 115
<cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 <cis' a'>8 a8 | \break % bar 116
\bar "|."
}
\new Staff = "down" {
\clef bass \key e \major \numericTimeSignature \time 4/4 \tempo 4 = 119
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 1
b,2~ b,8 cis8 dis8 cis8~ | % bar 2
cis2~ cis8 dis8 e8 a,8~ | % bar 3
a,2~ a,8 dis8 e8 e,8~ | \break % bar 4
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 5
b,2~ b,8 cis8 dis8 gis,8~ | % bar 6
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 7
a,2~ a,8 dis8 e8 e,8~ | \break % bar 8
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 9
b,2~ b,8 cis8 dis8 cis8~ | % bar 10
cis2~ cis8 dis8 e8 a,8~ | % bar 11
a,2~ a,8 dis8 e4 | \break % bar 12
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 13
b,2~ b,8 cis8 dis8 gis,8~ | % bar 14
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 15
a,2~ a,8 dis8 e4 | \break % bar 16
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 17
b,2~ b,8 cis8 dis8 cis8~ | % bar 18
cis2~ cis8 dis8 e8 a,8~ | % bar 19
a,2~ a,8 dis8 e4 | \break % bar 20
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 21
b,2~ b,8 cis8 dis8 gis,8~ | % bar 22
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 23
a,2~ a,8 dis8 e8 e,8~ | \break % bar 24
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 25
b,2~ b,8 cis8 dis8 cis8~ | % bar 26
cis2~ cis8 dis8 e8 a,8~ | % bar 27
a,2~ a,8 dis8 e4 | \break % bar 28
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 29
b,2~ b,8 cis8 dis8 gis,8~ | % bar 30
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 31
a,2. e,8 e,8~ | \break % bar 32
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 33
b,2~ b,8 cis8 dis8 cis8~ | % bar 34
cis2~ cis8 dis8 e8 a,8~ | % bar 35
a,2~ a,8 dis8 e4 | \break % bar 36
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 37
b,2~ b,8 cis8 dis8 gis,8~ | % bar 38
gis,4 gis,8 gis,8 gis,8 gis,8 gis,8 gis,8 | % bar 39
a,8 a,8 a,8 a,8 a,8 a,8 a,8 a,8 | \break % bar 40
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 41
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 42
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | % bar 43
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | \break % bar 44
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 45
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 46
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | % bar 47
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | \break % bar 48
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 49
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 50
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | % bar 51
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | \break % bar 52
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 53
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 54
<b,, b,>4. <e, e>8~ <e, e>2 | % bar 55
<b,, b,>4 <e, e>8 <a,, a,>8~ <a,, a,>2 | \break % bar 56
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 57
b,2~ b,8 cis8 dis8 cis8~ | % bar 58
cis2~ cis8 dis8 e8 a,8~ | % bar 59
a,2~ a,8 dis8 e8 e,8~ | \break % bar 60
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 61
b,2~ b,8 cis8 dis8 cis8~ | % bar 62
cis2~ cis8 dis8 e8 a,8~ | % bar 63
a,2~ a,8 dis8 e4 | \break % bar 64
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 65
b,2~ b,8 cis8 dis8 gis,8~ | % bar 66
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 67
a,2~ a,8 dis8 e8 e,8~ | \break % bar 68
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 69
b,2~ b,8 cis8 dis8 cis8~ | % bar 70
cis2~ cis8 dis8 e8 a,8~ | % bar 71
a,2~ a,8 dis8 e4 | \break % bar 72
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 73
b,2~ b,8 cis8 dis8 gis,8~ | % bar 74
gis,4 gis,8 gis,8 gis,8 gis,8 gis,8 gis,8 | % bar 75
a,8 a,8 a,8 a,8 a,8 a,8 a,8 a,8 | \break % bar 76
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 77
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 78
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | % bar 79
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | \break % bar 80
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 81
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 82
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | % bar 83
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | \break % bar 84
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 85
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 86
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | % bar 87
<e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 <e, e>8 | \break % bar 88
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 89
<a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 <a,, a,>8 | % bar 90
<b,, b,>4. <e, e>8~ <e, e>2 | % bar 91
<b,, b,>4 <e, e>8 <a,, a,>8~ <a,, a,>2 | \break % bar 92
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 93
b,2~ b,8 cis8 dis8 cis8~ | % bar 94
cis2~ cis8 dis8 e8 a,8~ | % bar 95
a,2~ a,8 dis8 e4 | \break % bar 96
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 97
b,2~ b,8 cis8 dis8 gis,8~ | % bar 98
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 99
a,2~ a,8 dis8 e4 | \break % bar 100
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 101
b,2~ b,8 cis8 dis8 cis8~ | % bar 102
cis2~ cis8 dis8 e8 a,8~ | % bar 103
a,2~ a,8 dis8 e4 | \break % bar 104
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 105
b,2~ b,8 cis8 dis8 gis,8~ | % bar 106
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 107
a,2~ a,8 dis8 e8 e,8~ | \break % bar 108
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 109
b,2~ b,8 cis8 dis8 cis8~ | % bar 110
cis2~ cis8 dis8 e8 a,8~ | % bar 111
a,2~ a,8 dis8 e4 | \break % bar 112
e,2~ e,8 fis,8 gis,8 b,8~ | % bar 113
b,2~ b,8 cis8 dis8 gis,8~ | % bar 114
gis,2~ gis,8 gis8 gis,8 a,8~ | % bar 115
a,2~ a,8 dis8 e4 | \break % bar 116
\bar "|."
}
>>
\layout { }
\midi { }
}

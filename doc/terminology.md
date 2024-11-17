Terminology:

Functions:

* to[X] - refers to self and sometimes to other entities [Sequence, SeqMember]
* is[X] - refers to self and sometimes to other entities [Sequence, SeqMember]
* insert[X] - insert entity before/after [Sequence]
* findIf[X] - return indices of matching entities [Sequence]
* replace[X] - replace matching entities with new entity [Sequence]
* map[X] - map operation [Sequence]
* filter[X] - filter operation [Sequence]
* partition[X] - partition operation [Sequence]
* groupBy[X] - group by operation [Sequence]
* with[X] - apply something to the whole Sequence (Melody]
* min[X] - the lowest value of X [Sequence, SeqMember]
* max[X] - the highest value of X [Sequence, SeqMember]
* combine[X] - algorithmically combine multiple Sequences into one [Sequence]

* patch[X] - modify existing values [SeqMember, MetaEvent, MetaList (proxy)]
* add[X] - modify metadata [MelodyMember, Melody (proxy)]
* set[X] - set metadata [SeqMember, Melody (proxy)]

Locations in a sequence or sequence member:

* [X]Before - refers to directly before a specific location [Sequence, MelodyMember]
* [X]At - refers to a specific location [Sequence]
* [X]After - refers to directly after a specific location [Sequence, MelodyMember]

Matchers [Sequence]:

* [X]If - refers to a matcher
* [X]IfWindow - refers to a matcher with a left-to-right sliding window
* [X]IfReverseWindow - refers to a matcher with a right-to-left sliding window
* [X]Nth - refers to every nth member
* [X]Slice - refers to a slice of the Sequence

Misc [Sequence]:
* [X]Left - unused, possible alias (eg: padLeft -> pad)
* [X]Right - apply to RHS of sequence
* [X]With - apply operation on a zipped collection of Sequences

Attributes:

* [X]Pitches [Sequence, SeqMember]
* [X][Rhythm|Volume|Delay|Offset|PostDelay|ExactTick|Channel] [Melody, MelodyMember]

Entities:

* [X][Int|Note|Chord|Melody]Event - [SeqMember subclass]
* [X][OtherTypesOf]Event - [MidiEvent subclass]

Sequence analysis:

* min|max|range|total|mean|mins|maxes
* is[X]: comparisons, take 0 or more Sequences, return Boolean
 * is[Sequence|SameClassAs|SameLengthAs|IdenticalTo] - spread operator
 * is[Subset|Superset|Transformation|Transposition|Inversion]Of - single argument
 * is[OwnRetrograde|OwnRetrogradeInversion] - no argument
 * isSelfSimilar[|By] - no argument

Sequence internals:

* index|indices: validate indices, convert negative ones
* val|valAt|len: access to sequence data
* clone: copy
* to[X]: conversion to a different datatype
* to[Melody|ChordSeq|NoteSeq] -> return appropriate type; different args in each
* toPitches -> return Number[][]
* toFlatPitches-> return Number[]

Melody internals:

* to[Rhythm|Volume|Delay|Offset|PostDelay|ExactTick|Channel] -> return Number[]
* toTicks -> return Number[]: used in the next three calls
* toMidiEvents -> return MidiEvent[]
* toMidiBytes -> return Number[]
* toSummary -> return Object[]: for canvas rendering
* with[Pitches|Rhythm|Volume|Delay|Offset|PostDelay|ExactTick|Channel]: return new Melody with these applied

Find/replace:

* insert[X]: add new values, return Sequence
 * insert[Before|After]; TODO: consider insert[Before|After]Nth
* findIf[X]: find indices, return Number|null or Number[]
 * findIf[|First|Last|Window|ReverseWindow]
* replace[X]: replace parts of the sequence with new values, return Sequence
 * replaceIf[|First|Last|Window|ReverseWindow] - matches findIf[X]
 * replace[At|Nth|Slice] - other replacements

Reorder members, return Sequence:

* swapAt
* shuffle
* sort
* retrograde

Add members, return Sequence:

* prepend
* append
* pad[|Right][|To]
* repeat

Remove members, return Sequence:

* empty
* [drop|keep][|Right|Nth|At|Slice]
* dedupe
* joinIf
* joinRepeats [Melody only]

Add and then remove, return Sequence:

* pad[|Right]To
* loop

Apply function to whole Sequence, return Sequence:

* filter|filterInPosition|filterWindow
* map|flatMap|mapWindow
* map presets:
 * invert|augment|diminish|mod|trim|wrap|bounce|scale|gamut
 * transpose[|ToMin|ToMax]
  * perhaps also add [invert|augment|diminish][|ToMin|ToMax]

NoteSeq-specific applications, not quite map() operations, return Sequence:

* density|deltas|runningTotal

Sequence -> Sequence[]

* [partition|groupBy][|InPosition]
* splitAt
* chop
* untwine

Sequence[] -> Sequence

* Arguments passed using spread operator:
 * twine,combine,flatCombine
 * combine[Min|Max|Or|And|Sum|Product|Diff|IfTrue] [some only for NoteSeq]
 * zipSequenceValues -> SeqMember[][]
 * [zip|map|filter]With

Sequence[2] -> Sequence[2]; passed as single sequence

* exchangeValuesIf
 * NoteSeq children exchangeValues[Decreasing|Increasing]

Sequence control flow:

* if|then|else|while|do|tap

Tick calculation in Melodies

* [start|next|last]Tick (MelodyMember)
 * TODO: start and last are not parallel terms
* endTick (Melody and Score)
 * TODO: perhaps lastTick/endTick should have the same names?

Canvas support:

* toSummary() 

Applying metadata to Melody members:

* push[Before|After] (name used in both Melody and MelodyMember)
* add[Delay|Offset|PostDelay]At,set[ExactTick]At
 * TODO: consistent terminology (ExactTick v At)
* with[Start|End]Tick()

Tick handling:

Logic:

For a MelodyMember:

|Condition|Start Tick|End Tick|Next Tick|
|:--------|:---------|:-------|:--------|
|at defined|at|at+delay+duration|at+duration|
|at not defined|curr+delay+offset|curr+delay+offset+duration|curr+delay+duration|

TODO: should offset be included when at is defined?

For a MetaEvent:

|Condition|Start Tick|
|:--------|:---------|
|at defined|at|
|at not defined|curr+offset|

Meaning of each term, in order of first use:

For a MelodyMember:

|Term|Meaning|
|:---|:------|
|((curr))|Tick immediately before processing current event|
|at|Set `curr` tick to `at`; change also applies to all subsequent events|
|delay|Shift this and all subsequent events by `delay` ticks|
|offset|Shift only this event by `offset` ticks|
|duration|This event lasts `duration` ticks|
|((next))|Tick immediately before processing next event|

For a MetaEvent:

|Term|Meaning|
|:---|:------|
|((curr))|Start tick of the event this MetaEvent is associated with (after applying at/delay/offset)|
|at|This MetaEvent occurs at tick `at`.|
|offset|If `at` is not defined, this MetaEvent occurs at tick `curr+offset`.|

TODO: Verify possible terminology changes
[new]     = start_tick_once
at        = start_tick
offset    = delay_once
delay     = delay
duration  = duration

thinking of it another way
- rest [time before or after note, continuing]
- exact time [could be just once or continuing]
- offset [could be just once or continuing]

so:
MelodyMembers
start_tick [once/continuing] = at/????
offset [once/continuing] = offset/postdelay
duration

metaevents
start_tick[once] = at
offset[once] = offset

[MelodyMembers]
at -> set [withExactTickAt]
offset -> offset [not currently used] [addOffsetAt]
delay -> rest before [addDelayAt] [could be addRestBefore]
duration -> note length

[metaevents]
at -> exact tick
offset -> offset

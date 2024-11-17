methods which (re)construct all members but are not optimisable
[in Seq]
- to*Seq()

methods which (re)construct all members and may be optimisable
- combineMin/Max/And/Or()

methods which (re)construct some members, thus are safe but may be optimisable
[in coll]
- replaceRelative() - via replacer()
- insertBefore()/insertAfter()
- replaceIndices()/replace*Index/replaceIf/replaceNth/replaceSlice()
[in Seq]
- replaceIf[Reverse|]Window()

methods which (re)construct any newly added members, thus are safe and not easily optimisable
[in Seq]
- setSlice()
- pad*()
- *InPosition()

methods which do not (re)construct members but are safe
[in coll]
- append()
- prepend()

mapper methods that do not require a (re)construction case
[in Seq]
- withPitch[es][At]()
- mapPitch[es]()
- mapEachPitch()
- filterPitches()
- keep[Top|Bottom]Pitches()
- transpose*()
- invert()
- augment()
- diminish()
- mod()
- trim()
- bounce()
- scale()
- gamut()

methods which do not (re)construct members and thus will throw errors if you do things like .map(v => v.val() + 1)
- map*()
- flatMap*()
- mapWindow()
- mapWith()
- appendItems()
- prependItems()
- [flatC|c]ombine()

methods which do not create new members and are thus irrelevant tothis argument
[in coll]
- clone()
- empty()
- filter()
- keep*()
- drop*()
- retrograde()
- swapAt()
- splitAt()
- partition()
- groupBy()
[in Seq]
- loop()/repeat()/dupe()/dedupe()/shuffle()
- filterWindow()
- sort()
- chop()
- [un]twine()
- filterWith()
- exchangeValuesIf()

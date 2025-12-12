import { Ionicons } from '@expo/vector-icons';

export const icons = {
  index: (props: any) => <Ionicons name={props.isFocused ? "home" : "home-outline"} size={26} {...props} />,
  expenses: (props: any) => <Ionicons name={props.isFocused ? "receipt" : "receipt-outline"} size={26} {...props} />,
  groups: (props: any) => <Ionicons name={props.isFocused ? "people" : "people-outline"} size={26} {...props} />,
  books: (props: any) => <Ionicons name={props.isFocused ? "library" : "library-outline"} size={26} {...props} />,
  profile: (props: any) => <Ionicons name={props.isFocused ? "person" : "person-outline"} size={26} {...props} />,
};
